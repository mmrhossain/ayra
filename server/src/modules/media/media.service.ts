import { createHash } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { AppError } from "../../common/errors/AppError.ts";
import { logger } from "../../common/looger/logger.ts";
import { withDbTimeout } from "../../common/utils/db-retry.ts";
import {
  generateCloudinaryPublicId,
  uniquePublicId,
} from "../../common/utils/cloudinary-public-id.ts";
import { assertAllowedImageStream } from "../../common/utils/image-magic.ts";
import {
  cloudinary,
  deleteCloudinaryAsset,
  uploadImageFileToCloudinary,
} from "../../lib/cloudinary.ts";
import { env } from "../../config/env.ts";
import { paginated } from "../../common/utils/paginate.ts";
import { prisma, type TransactionClient } from "../../lib/prisma.ts";
import {
  IMAGE_TYPE_PRESETS,
  MEDIA_PENDING_TTL_MS,
  MEDIA_PENDING_VISIBLE_MS,
  MEDIA_SOFT_DELETE_RETENTION_MS,
} from "./media.constants.ts";
import {
  IMAGE_TYPE_VALUES,
  type ImageFile,
  type ImageType,
  type ListMediaQuery,
  type MediaLibraryItem,
  type MediaOwner,
  type UploadedImage,
} from "./media.types.ts";

/**
 * Minimal database surface shared by `prisma` and an interactive
 * `TransactionClient`. Attachment bookkeeping can therefore run inside the
 * caller's product transaction while Cloudinary operations stay outside it.
 */
export type MediaDbClient = Pick<TransactionClient, "mediaAsset">;

const unlinkQuietly = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch {
    // Suppress cleanup errors
  }
};

const hashImageFile = async (filePath: string): Promise<string> => {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
};

const toUploadedImage = (
  publicId: string,
  type: ImageType,
  fallbackUrl?: string
): UploadedImage => {
  const storedId = uniquePublicId(publicId) ?? publicId;
  const variants = buildImageUrls(storedId, type);
  const first = variants[0] ?? fallbackUrl;
  if (!first) {
    throw new AppError("Image transformation not found", 500);
  }
  return {
    publicId: storedId,
    url: fallbackUrl ?? first,
    secure_url: first,
    variants,
    imageUrl: first,
    ...(variants[1] ? { mobileImageUrl: variants[1] } : {}),
  };
};

const uploadOptionsFor = (type: ImageType) => {
  const preset = IMAGE_TYPE_PRESETS[type];
  return {
    asset_folder: preset.folder,
    use_filename: false,
  };
};

const recordPendingAsset = async (input: {
  publicId: string;
  url: string;
  type: ImageType;
  ownerUserId: string;
  bytes?: number;
  contentHash?: string;
}) => {
  const hashField = input.contentHash ? { contentHash: input.contentHash } : {};
  // Bound the write: a suspended/unreachable database must fail the request
  // fast with a clear message instead of hanging for the pool query timeout.
  await withDbTimeout(
    () =>
      prisma.mediaAsset.upsert({
        where: { publicId: input.publicId },
        create: {
          publicId: input.publicId,
          url: input.url,
          type: input.type,
          status: "PENDING",
          ownerUserId: input.ownerUserId,
          bytes: input.bytes ?? null,
          ...hashField,
        },
        update: {
          url: input.url,
          type: input.type,
          status: "PENDING",
          ownerUserId: input.ownerUserId,
          entityType: null,
          entityId: null,
          detachedAt: null,
          bytes: input.bytes ?? null,
          ...hashField,
        },
      }),
    env.MEDIA_DB_WRITE_TIMEOUT_MS,
    () => new AppError("Database is busy. Please try again.", 503)
  );
};

export const uploadSingleImage = async (
  file: ImageFile,
  type: ImageType,
  ownerUserId: string
): Promise<UploadedImage> => {
  try {
    await assertAllowedImageStream(file.path, file.mimetype, file.originalname);

    const contentHash = await hashImageFile(file.path).catch(() => undefined);

    // A retried upload (for example, after a product save rolled back) reuses
    // the still-pending asset for identical bytes instead of creating a second
    // Cloudinary object. The 10s floor avoids returning an upload that another
    // request is still writing.
    const reusable = contentHash
      ? await withDbTimeout(
          () =>
            prisma.mediaAsset.findFirst({
              where: {
                ownerUserId,
                type,
                contentHash,
                status: "PENDING",
                createdAt: { lt: new Date(Date.now() - 10_000) },
              },
              orderBy: { createdAt: "desc" },
            }),
          env.MEDIA_DB_WRITE_TIMEOUT_MS,
          () => new AppError("Database is busy. Please try again.", 503)
        )
      : null;
    if (reusable) {
      return toUploadedImage(reusable.publicId, type, reusable.url);
    }

    // The delivery URL is derived purely from the public id, so the PENDING row
    // can be written in parallel with the Cloudinary upload: the client waits
    // for max(cloudinary, db) instead of cloudinary + db.
    const publicId = generateCloudinaryPublicId();
    const predicted = toUploadedImage(publicId, type);

    const [uploadResult, recordResult] = await Promise.allSettled([
      uploadImageFileToCloudinary(file.path, {
        ...uploadOptionsFor(type),
        public_id: publicId,
      }),
      recordPendingAsset({
        publicId: predicted.publicId,
        url: predicted.secure_url,
        type,
        ownerUserId,
        bytes: file.size,
        ...(contentHash ? { contentHash } : {}),
      }),
    ]);

    if (uploadResult.status === "rejected") {
      // Cloudinary never stored the asset; drop the PENDING row we wrote.
      await destroyUploadedAsset(predicted.publicId);
      const reason = uploadResult.reason;
      if (reason instanceof AppError) throw reason;
      throw new AppError("Cloudinary upload failed", 502);
    }

    if (recordResult.status === "rejected") {
      // The asset exists but we could not track it; remove it so it is not
      // orphaned in Cloudinary, then surface the original error (e.g. 503).
      await deleteCloudinaryAsset(predicted.publicId);
      throw recordResult.reason;
    }

    const result = uploadResult.value;
    return toUploadedImage(
      result.public_id ?? publicId,
      type,
      result.secure_url ?? result.url
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Cloudinary upload failed", 502);
  } finally {
    await unlinkQuietly(file.path);
  }
};

export const uploadMultipleImages = async (
  files: ImageFile[],
  type: ImageType,
  ownerUserId: string
): Promise<UploadedImage[]> => {
  const preset = IMAGE_TYPE_PRESETS[type];

  if (!preset.allowMultiple) {
    throw new AppError(`Image type "${type}" does not allow multiple files`, 400);
  }

  if (files.length > preset.maxFiles) {
    throw new AppError(`A maximum of ${preset.maxFiles} ${type} images is allowed`, 400);
  }

  const results = await Promise.allSettled(
    files.map((file) => uploadSingleImage(file, type, ownerUserId))
  );

  const uploaded = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );

  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    await Promise.allSettled(uploaded.map((item) => destroyUploadedAsset(item.publicId)));
    const reason = failed.reason;
    if (reason instanceof AppError) throw reason;
    throw new AppError("Cloudinary upload failed", 502);
  }

  return uploaded;
};

const storedPublicIds = (
  publicIds: Array<string | null | undefined>
): string[] => [
  ...new Set(
    publicIds
      .map((id) => uniquePublicId(id) ?? id?.trim())
      .filter((id): id is string => Boolean(id))
  ),
];

const isImageType = (value: string): value is ImageType =>
  (IMAGE_TYPE_VALUES as readonly string[]).includes(value);

const toLibraryItem = (asset: {
  publicId: string;
  url: string;
  type: string;
  status: "PENDING" | "ATTACHED" | "SOFT_DELETED";
  createdAt: Date;
}): MediaLibraryItem => {
  const type = isImageType(asset.type) ? asset.type : "product";
  const media = toUploadedImage(asset.publicId, type, asset.url);
  return {
    ...media,
    type,
    status: asset.status === "ATTACHED" ? "ATTACHED" : "PENDING",
    createdAt: asset.createdAt,
  };
};

export const listMediaLibrary = async (query: ListMediaQuery) => {
  const where = {
    type: query.type,
    OR: [
      { status: "ATTACHED" as const },
      {
        status: "PENDING" as const,
        createdAt: { gte: new Date(Date.now() - MEDIA_PENDING_VISIBLE_MS) },
      },
    ],
  };
  const [total, assets] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        publicId: true,
        url: true,
        type: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);
  return paginated(
    assets.map(toLibraryItem),
    query.page,
    query.limit,
    total
  );
};

const destroyUploadedAsset = async (publicId: string): Promise<boolean> => {
  const storedId = uniquePublicId(publicId) ?? publicId;
  const destroyed = await deleteCloudinaryAsset(storedId);
  if (destroyed === false) {
    // CDN delete failed. Flag the row as SOFT_DELETED so the janitor retries it
    // later instead of deleting the row now and orphaning the Cloudinary object.
    await prisma.mediaAsset.updateMany({
      where: { publicId: storedId },
      data: { status: "SOFT_DELETED", detachedAt: new Date() },
    });
    return false;
  }
  await prisma.mediaAsset.deleteMany({ where: { publicId: storedId } });
  return true;
};

export const deleteImage = async (publicId: string, ownerUserId?: string): Promise<void> => {
  const storedId = uniquePublicId(publicId) ?? publicId;
  if (ownerUserId) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { publicId: storedId },
      select: { ownerUserId: true },
    });
    if (!asset) {
      throw new AppError("Media asset not found", 404);
    }
    if (asset.ownerUserId !== ownerUserId) {
      throw new AppError("Forbidden: you do not own this media asset", 403);
    }
  }
  await destroyUploadedAsset(storedId);
};

export const deleteImages = async (
  publicIds: Array<string | null | undefined>,
  ownerUserId?: string
): Promise<void> => {
  const uniqueIds = storedPublicIds(publicIds);
  if (uniqueIds.length === 0) return;

  if (ownerUserId) {
    const owned = await prisma.mediaAsset.findMany({
      where: { publicId: { in: uniqueIds }, ownerUserId },
      select: { publicId: true },
    });
    const ownedSet = new Set(owned.map((asset) => asset.publicId));
    const unauthorized = uniqueIds.filter((id) => !ownedSet.has(id));
    if (unauthorized.length > 0) {
      const existing = await prisma.mediaAsset.findMany({
        where: { publicId: { in: unauthorized } },
        select: { publicId: true },
      });
      if (existing.length > 0) {
        throw new AppError("Forbidden: you do not own this media asset", 403);
      }
    }
    const deletable = uniqueIds.filter((id) => ownedSet.has(id));
    if (deletable.length === 0) return;
    await Promise.allSettled(deletable.map((publicId) => destroyUploadedAsset(publicId)));
    return;
  }

  await Promise.allSettled(uniqueIds.map((publicId) => destroyUploadedAsset(publicId)));
};

export const attachMediaAssets = async (
  publicIds: Array<string | null | undefined>,
  entityType: MediaOwner,
  entityId: string,
  ownerUserId?: string,
  db: MediaDbClient = prisma
): Promise<void> => {
  const uniqueIds = storedPublicIds(publicIds);
  if (uniqueIds.length === 0) return;
  // When the acting user is known (personal assets: avatar), scope
  // every read/write to assets they own so one user cannot attach another user's
  // pending asset. Admin-managed catalog entities omit it (admins are trusted).
  const ownerScope = ownerUserId ? { ownerUserId } : {};

  // Reject missing claims: every referenced asset must exist (and, when scoped,
  // be owned by the caller). A silent no-op would leave the entity pointing at an
  // untracked public id.
  const assets = await db.mediaAsset.findMany({
    where: { publicId: { in: uniqueIds }, ...ownerScope },
    select: { publicId: true, status: true, entityType: true, entityId: true },
  });
  const found = new Set(assets.map((asset) => asset.publicId));
  const missing = uniqueIds.filter((publicId) => !found.has(publicId));
  if (missing.length > 0) {
    throw new AppError("Media asset not found or not owned by you", 404);
  }

  // Reject conflicting claims: an asset already attached to a different entity
  // (or queued for CDN deletion) must not be silently re-pointed.
  const conflicting = assets.filter(
    (asset) =>
      asset.status === "SOFT_DELETED" ||
      (asset.status === "ATTACHED" &&
        !(asset.entityType === entityType && asset.entityId === entityId))
  );
  if (conflicting.length > 0) {
    throw new AppError("Media asset is already in use", 409);
  }

  await db.mediaAsset.updateMany({
    where: {
      publicId: { in: uniqueIds },
      ...ownerScope,
      status: { not: "SOFT_DELETED" },
    },
    data: {
      status: "ATTACHED",
      entityType,
      entityId,
      detachedAt: null,
    },
  });
};

export const detachMediaAssets = async (
  publicIds: Array<string | null | undefined>,
  db: MediaDbClient = prisma
): Promise<void> => {
  const uniqueIds = storedPublicIds(publicIds);
  if (uniqueIds.length === 0) return;
  await db.mediaAsset.updateMany({
    where: {
      publicId: { in: uniqueIds },
      status: { not: "SOFT_DELETED" },
    },
    data: {
      status: "PENDING",
      entityType: null,
      entityId: null,
      detachedAt: new Date(),
    },
  });
};

export const buildImageUrls = (publicId: string, type: ImageType): string[] => {
  const preset = IMAGE_TYPE_PRESETS[type];
  const deliveryId = uniquePublicId(publicId) ?? publicId;
  return preset.variants.map((transformation) =>
    cloudinary.url(deliveryId, {
      secure: true,
      transformation: [
        {
          width: transformation.width,
          height: transformation.height,
          crop: transformation.crop,
          ...(transformation.gravity ? { gravity: transformation.gravity } : {}),
          fetch_format: "auto",
          quality: "auto:good",
          dpr: "auto",
        },
      ],
    })
  );
};

export const purgeExpiredMediaAssets = async (): Promise<number> => {
  const now = Date.now();
  const pendingCutoff = new Date(now - MEDIA_PENDING_TTL_MS);
  const softDeleteCutoff = new Date(now - MEDIA_SOFT_DELETE_RETENTION_MS);

  const expired = await prisma.mediaAsset.findMany({
    where: {
      OR: [
        { status: "PENDING", createdAt: { lt: pendingCutoff } },
        { status: "SOFT_DELETED", detachedAt: { lt: softDeleteCutoff } },
      ],
    },
    select: { publicId: true },
    take: 100,
  });

  if (expired.length === 0) return 0;

  let purged = 0;
  for (const asset of expired) {
    try {
      // On failure the row is kept so the next cycle retries it.
      const destroyed = await destroyUploadedAsset(asset.publicId);
      if (destroyed) purged += 1;
    } catch (error) {
      logger.error({
        message: `Media janitor failed for ${asset.publicId}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return purged;
};

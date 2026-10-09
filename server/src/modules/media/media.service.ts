import { unlink } from "node:fs/promises";
import { AppError } from "../../common/errors/AppError.ts";
import { logger } from "../../common/looger/logger.ts";
import { uniquePublicId } from "../../common/utils/cloudinary-public-id.ts";
import { assertAllowedImageStream } from "../../common/utils/image-magic.ts";
import {
  cloudinary,
  deleteCloudinaryAsset,
  uploadImageFileToCloudinary,
} from "../../lib/cloudinary.ts";
import { paginated } from "../../common/utils/paginate.ts";
import { prisma } from "../../lib/prisma.ts";
import {
  IMAGE_TYPE_PRESETS,
  MEDIA_PENDING_TTL_MS,
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

// Optimized: Removed heavy 2000x2000 synchronous scaling limit on ingest
// to speed up Cloudinary upload response times. Variants handle presentation sizes.
const MASTER_TRANSFORMATION = {
  fetch_format: "auto" as const,
  quality: "auto" as const,
  flags: "strip_profile",
};

const unlinkQuietly = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch {
    // Suppress cleanup errors
  }
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
  };
};

const uploadOptionsFor = (type: ImageType) => {
  const preset = IMAGE_TYPE_PRESETS[type];
  return {
    asset_folder: preset.folder,
    unique_filename: true,
    use_filename: false,
    transformation: [MASTER_TRANSFORMATION],
    timeout: 120000,
  };
};

const recordPendingAsset = async (input: {
  publicId: string;
  url: string;
  type: ImageType;
  ownerUserId: string;
  bytes?: number;
}) => {
  await prisma.mediaAsset.upsert({
    where: { publicId: input.publicId },
    create: {
      publicId: input.publicId,
      url: input.url,
      type: input.type,
      status: "PENDING",
      ownerUserId: input.ownerUserId,
      bytes: input.bytes ?? null,
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
    },
  });
};

export const uploadSingleImage = async (
  file: ImageFile,
  type: ImageType,
  ownerUserId: string
): Promise<UploadedImage> => {
  try {
    await assertAllowedImageStream(file.path, file.mimetype, file.originalname);
    const result = await uploadImageFileToCloudinary(file.path, uploadOptionsFor(type));
    const media = toUploadedImage(result.public_id, type, result.secure_url ?? result.url);
    await recordPendingAsset({
      publicId: media.publicId,
      url: media.secure_url,
      type,
      ownerUserId,
      bytes: file.size,
    });
    return media;
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
    status: { in: ["PENDING" as const, "ATTACHED" as const] },
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

const destroyUploadedAsset = async (publicId: string) => {
  const storedId = uniquePublicId(publicId) ?? publicId;
  await deleteCloudinaryAsset(storedId);
  await prisma.mediaAsset.deleteMany({ where: { publicId: storedId } });
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
  entityId: string
): Promise<void> => {
  const uniqueIds = storedPublicIds(publicIds);
  if (uniqueIds.length === 0) return;
  await prisma.mediaAsset.updateMany({
    where: {
      publicId: { in: uniqueIds },
      OR: [
        { status: "PENDING" },
        { entityType: null },
        { entityId: null },
      ],
    },
    data: {
      status: "ATTACHED",
      entityType,
      entityId,
      detachedAt: null,
    },
  });
  await prisma.mediaAsset.updateMany({
    where: {
      publicId: { in: uniqueIds },
      status: { not: "SOFT_DELETED" },
    },
    data: {
      status: "ATTACHED",
      detachedAt: null,
    },
  });
};

export const detachMediaAssets = async (
  _publicIds: Array<string | null | undefined>
): Promise<void> => {
};

export const replaceAttachedAssets = async (input: {
  previousPublicIds: Array<string | null | undefined>;
  nextPublicIds: Array<string | null | undefined>;
  entityType: MediaOwner;
  entityId: string;
}): Promise<void> => {
  const previous = storedPublicIds(input.previousPublicIds);
  const next = storedPublicIds(input.nextPublicIds);
  const nextSet = new Set(next);
  const stale = previous.filter((id) => !nextSet.has(id));
  await attachMediaAssets(next, input.entityType, input.entityId);
  await detachMediaAssets(stale);
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
          quality: "auto",
        },
      ],
    })
  );
};

export const buildImageUrl = (publicId: string, type: ImageType): string => {
  const urls = buildImageUrls(publicId, type);
  const firstUrl = urls[0];
  if (!firstUrl) {
    throw new AppError("Image transformation not found", 500);
  }
  return firstUrl;
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
      await destroyUploadedAsset(asset.publicId);
      purged += 1;
    } catch (error) {
      logger.error({
        message: `Media janitor failed for ${asset.publicId}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return purged;
};

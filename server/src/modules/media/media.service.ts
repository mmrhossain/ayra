import { unlink } from "node:fs/promises";
import { AppError } from "../../common/errors/AppError.ts";
import { logger } from "../../common/looger/logger.ts";
import { assertAllowedImageStream } from "../../common/utils/image-magic.ts";
import {
  cloudinary,
  deleteCloudinaryAsset,
  uploadImageFileToCloudinary,
} from "../../lib/cloudinary.ts";
import { prisma } from "../../lib/prisma.ts";
import {
  IMAGE_TYPE_PRESETS,
  MEDIA_PENDING_TTL_MS,
  MEDIA_SOFT_DELETE_RETENTION_MS,
} from "./media.constants.ts";
import type { ImageFile, ImageType, MediaOwner, UploadedImage } from "./media.types.ts";

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
  const variants = buildImageUrls(publicId, type);
  const first = variants[0] ?? fallbackUrl;
  if (!first) {
    throw new AppError("Image transformation not found", 500);
  }
  return {
    publicId,
    url: fallbackUrl ?? first,
    secure_url: first,
    variants,
  };
};

const uploadOptionsFor = (type: ImageType) => {
  const preset = IMAGE_TYPE_PRESETS[type];
  return {
    folder: preset.folder,
    transformation: [MASTER_TRANSFORMATION],
    timeout: 120000, // Explicit 2-minute timeout safeguard for large files/slow networks
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

const destroyUploadedAsset = async (publicId: string) => {
  await deleteCloudinaryAsset(publicId);
  await prisma.mediaAsset.deleteMany({ where: { publicId } });
};

export const deleteImage = async (publicId: string, ownerUserId?: string): Promise<void> => {
  if (ownerUserId) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { publicId },
      select: { ownerUserId: true },
    });
    if (!asset) {
      throw new AppError("Media asset not found", 404);
    }
    if (asset.ownerUserId !== ownerUserId) {
      throw new AppError("Forbidden: you do not own this media asset", 403);
    }
  }
  await destroyUploadedAsset(publicId);
};

export const deleteImages = async (
  publicIds: Array<string | null | undefined>,
  ownerUserId?: string
): Promise<void> => {
  const uniqueIds = [...new Set(publicIds.filter((id): id is string => Boolean(id)))];
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
  const uniqueIds = [...new Set(publicIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return;
  await prisma.mediaAsset.updateMany({
    where: { publicId: { in: uniqueIds } },
    data: {
      status: "ATTACHED",
      entityType,
      entityId,
      detachedAt: null,
    },
  });
};

export const detachMediaAssets = async (
  publicIds: Array<string | null | undefined>
): Promise<void> => {
  const uniqueIds = [...new Set(publicIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return;
  await prisma.mediaAsset.updateMany({
    where: { publicId: { in: uniqueIds } },
    data: {
      status: "SOFT_DELETED",
      detachedAt: new Date(),
    },
  });
};

export const replaceAttachedAssets = async (input: {
  previousPublicIds: Array<string | null | undefined>;
  nextPublicIds: Array<string | null | undefined>;
  entityType: MediaOwner;
  entityId: string;
}): Promise<void> => {
  const previous = [...new Set(input.previousPublicIds.filter((id): id is string => Boolean(id)))];
  const next = [...new Set(input.nextPublicIds.filter((id): id is string => Boolean(id)))];
  const nextSet = new Set(next);
  const stale = previous.filter((id) => !nextSet.has(id));
  await attachMediaAssets(next, input.entityType, input.entityId);
  await detachMediaAssets(stale);
};

export const buildImageUrls = (publicId: string, type: ImageType): string[] => {
  const preset = IMAGE_TYPE_PRESETS[type];
  return preset.variants.map((transformation) =>
    cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: transformation.width,
          height: transformation.height,
          crop: transformation.crop,
          gravity: transformation.gravity,
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

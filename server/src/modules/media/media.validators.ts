import { z } from "zod";
import { env } from "../../config/env.ts";
import { IMAGE_TYPE_VALUES } from "./media.types.ts";
import { CLOUDINARY_HOST } from "./media.constants.ts";

export const imageTypeSchema = z.enum(IMAGE_TYPE_VALUES);

export const singleUploadQuerySchema = z.object({
  type: imageTypeSchema,
});

export const multipleUploadQuerySchema = z.object({
  type: z.literal("product"),
});

const cloudinaryPathPattern = /^\/[^/]+\/image\/upload\//i;

const isTrustedCloudinaryUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== CLOUDINARY_HOST) return false;
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && !parsed.pathname.startsWith(`/${cloudName}/`)) {
      return false;
    }
    return cloudinaryPathPattern.test(parsed.pathname);
  } catch {
    return false;
  }
};

export const cloudinaryImageUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2000)
  .refine(isTrustedCloudinaryUrl, {
    message: "Image URL must be a trusted Cloudinary HTTPS URL",
  });

export const optionalCloudinaryImageUrlSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  cloudinaryImageUrlSchema.optional()
);

export const mediaPublicIdSchema = z.string().trim().min(1).max(500);

export const optionalMediaPublicIdSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  mediaPublicIdSchema.optional()
);

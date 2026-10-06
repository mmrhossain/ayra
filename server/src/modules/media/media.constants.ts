import type { AuthRole, ImageType, UploadPreset } from "./media.types.ts";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_CONCURRENT_UPLOAD_REQUESTS = 10;
export const MEDIA_PENDING_TTL_MS = 24 * 60 * 60 * 1000;
export const MEDIA_SOFT_DELETE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const MEDIA_WORKER_INTERVAL_MS = 15 * 60 * 1000;
export const MEDIA_JANITOR_INTERVAL_MS = MEDIA_WORKER_INTERVAL_MS;
export const MASTER_MAX_DIMENSION = 2000;

export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export const IMAGE_TYPE_PRESETS: Record<ImageType, UploadPreset> = {
  product: {
    folder: "products",
    masterMax: MASTER_MAX_DIMENSION,
    variants: [{ width: 1200, height: 1200, crop: "fill", gravity: "center" }],
    maxFiles: MAX_PRODUCT_IMAGES,
    allowMultiple: true,
  },
  category: {
    folder: "categories",
    masterMax: MASTER_MAX_DIMENSION,
    variants: [{ width: 1920, height: 640, crop: "fit", gravity: "center" }],
    maxFiles: 1,
    allowMultiple: false,
  },
  slider: {
    folder: "sliders",
    masterMax: MASTER_MAX_DIMENSION,
    variants: [
      { width: 1920, height: 820, crop: "fill", gravity: "auto" },
      { width: 960, height: 1080, crop: "fill", gravity: "auto" },
    ],
    maxFiles: 1,
    allowMultiple: false,
  },
  blog: {
    folder: "blogs",
    masterMax: MASTER_MAX_DIMENSION,
    variants: [{ width: 1600, height: 900, crop: "fill", gravity: "center" }],
    maxFiles: 1,
    allowMultiple: false,
  },
  customer_avatar: {
    folder: "avatars/customers",
    masterMax: MASTER_MAX_DIMENSION,
    variants: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    maxFiles: 1,
    allowMultiple: false,
  },
  vendor_avatar: {
    folder: "avatars/vendors",
    masterMax: MASTER_MAX_DIMENSION,
    variants: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    maxFiles: 1,
    allowMultiple: false,
  },
};

export const UPLOAD_TYPE_ROLES: Record<ImageType, readonly AuthRole[]> = {
  product: ["ADMIN"],
  category: ["ADMIN"],
  slider: ["ADMIN"],
  blog: ["ADMIN"],
  customer_avatar: ["CUSTOMER", "ADMIN"],
  vendor_avatar: ["VENDOR", "ADMIN"],
};

export const SINGLE_IMAGE_TYPES = [
  "category",
  "slider",
  "blog",
  "customer_avatar",
  "vendor_avatar",
] as const;

export const MULTIPLE_IMAGE_TYPES = ["product"] as const;

export const CLOUDINARY_HOST = "res.cloudinary.com";

import { Router } from "express";
import mediaRoutes from "./media.routes.ts";

const router = Router();
router.use(mediaRoutes);

export default router;

export {
  uploadSingleImage,
  uploadMultipleImages,
  listMediaLibrary,
  deleteImage,
  deleteImages,
  attachMediaAssets,
  detachMediaAssets,
  replaceAttachedAssets,
  buildImageUrl,
  buildImageUrls,
  purgeExpiredMediaAssets,
} from "./media.service.ts";
export {
  IMAGE_TYPE_VALUES,
  type ImageType,
  type UploadedImage,
} from "./media.types.ts";
export {
  IMAGE_TYPE_PRESETS,
  SINGLE_IMAGE_TYPES,
  MULTIPLE_IMAGE_TYPES,
  MAX_PRODUCT_IMAGES,
} from "./media.constants.ts";
export {
  cloudinaryImageUrlSchema,
  optionalCloudinaryImageUrlSchema,
  nullableCloudinaryImageUrlSchema,
  mediaPublicIdSchema,
  optionalMediaPublicIdSchema,
  nullableMediaPublicIdSchema,
} from "./media.validators.ts";

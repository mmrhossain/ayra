import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.ts";

import { uploadConcurrencyGuard } from "../../common/middleware/upload-concurrency.middleware.ts";
import {
  productImagesUpload,
  singleImageUpload,
} from "../../common/middleware/upload.middleware.ts";
import {
  uploadMultipleImagesHandler,
  uploadSingleImageHandler,
} from "./media.controller.ts";
import {
  requireMultipleUploadPermission,
  requireSingleUploadPermission,
} from "./media.permission.ts";

const router = Router();

router.post(
  "/media/upload",
  requireAuth,
  uploadConcurrencyGuard,
  singleImageUpload,
  requireSingleUploadPermission,
  uploadSingleImageHandler
);

router.post(
  "/media/uploads",
  requireAuth,
  uploadConcurrencyGuard,
  productImagesUpload,
  requireMultipleUploadPermission,
  uploadMultipleImagesHandler
);

export default router;

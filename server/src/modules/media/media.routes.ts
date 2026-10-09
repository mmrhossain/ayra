import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.ts";

import { uploadConcurrencyGuard } from "../../common/middleware/upload-concurrency.middleware.ts";
import {
  productImagesUpload,
  singleImageUpload,
} from "../../common/middleware/upload.middleware.ts";
import {
  listMediaHandler,
  uploadMultipleImagesHandler,
  uploadSingleImageHandler,
} from "./media.controller.ts";
import {
  requireListMediaPermission,
  requireMultipleUploadPermission,
  requireSingleUploadPermission,
} from "./media.permission.ts";

const router = Router();

router.get(
  "/media",
  requireAuth,
  requireListMediaPermission,
  listMediaHandler
);

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

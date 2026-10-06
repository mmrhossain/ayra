import multer from "multer";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "../errors/AppError.ts";
import { ALLOWED_EXT, ALLOWED_MIME, MAX_IMAGE_BYTES } from "../../modules/media/media.constants.ts";

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    cb(
      new AppError(
        "Invalid image type. Only jpg, jpeg, png, and webp are allowed",
        400
      )
    );
    return;
  }
  cb(null, true);
};

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `media-${randomUUID()}${ext}`);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES },
});

export { MAX_IMAGE_BYTES };

export const singleImageUpload = diskUpload.single("image");

export const productImagesUpload = diskUpload.array("images", 5);

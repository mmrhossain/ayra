import { unlink } from "node:fs/promises";
import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.ts";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { successResponse } from "../../common/utils/response.ts";
import { MAX_PRODUCT_IMAGES } from "./media.constants.ts";
import {
  listMediaLibrary,
  uploadMultipleImages,
  uploadSingleImage,
} from "./media.service.ts";
import type { ImageFile } from "./media.types.ts";
import {
  listMediaQuerySchema,
  multipleUploadQuerySchema,
  singleUploadQuerySchema,
} from "./media.validators.ts";

const toImageFile = (file: Express.Multer.File): ImageFile => {
  if (!file.path) {
    throw new AppError("Image file is required", 400);
  }
  return {
    path: file.path,
    mimetype: file.mimetype,
    originalname: file.originalname,
    size: file.size,
  };
};

const unlinkFiles = async (files: Express.Multer.File[]) => {
  await Promise.allSettled(
    files.map(async (file) => {
      if (!file.path) return;
      try {
        await unlink(file.path);
      } catch {
      }
    })
  );
};

export const listMediaHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listMediaQuerySchema.parse(req.query);
    const result = await listMediaLibrary(query);
    successResponse(res, result, "Media library fetched");
  }
);

export const uploadSingleImageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { type } = singleUploadQuerySchema.parse({
      type: req.query.type ?? req.body?.type,
    });
    const userId = req.auth?.user.id;
    if (!userId) {
      throw new AppError("Unauthorized: authentication required", 401);
    }
    if (!req.file) {
      throw new AppError("Image file is required", 400);
    }

    try {
      const result = await uploadSingleImage(toImageFile(req.file), type, userId);
      successResponse(res, result, "Image uploaded", 201);
    } catch (error) {
      await unlinkFiles(req.file ? [req.file] : []);
      throw error;
    }
  }
);

export const uploadMultipleImagesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { type } = multipleUploadQuerySchema.parse({
      type: req.query.type ?? req.body?.type,
    });
    const userId = req.auth?.user.id;
    if (!userId) {
      throw new AppError("Unauthorized: authentication required", 401);
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      throw new AppError("At least one image file is required", 400);
    }
    if (files.length > MAX_PRODUCT_IMAGES) {
      await unlinkFiles(files);
      throw new AppError("A maximum of 5 product images is allowed", 400);
    }

    try {
      const results = await uploadMultipleImages(
        files.map(toImageFile),
        type,
        userId
      );
      successResponse(res, results, "Images uploaded", 201);
    } catch (error) {
      await unlinkFiles(files);
      throw error;
    }
  }
);

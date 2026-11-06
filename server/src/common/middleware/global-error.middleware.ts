import type { NextFunction, Request, Response } from "express";
import { unlink } from "node:fs/promises";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.ts";
import { logger } from "../looger/logger.ts";
import { isPrismaKnownRequestError } from "../utils/prisma-error.ts";
import { mapPrismaError } from "../utils/error-response.ts";
import { MAX_IMAGE_BYTES } from "./upload.middleware.ts";

// Multer writes uploads to disk before the handler runs. On any downstream
// error (validation, permission, Cloudinary) those temp files must be removed,
// otherwise they leak in os.tmpdir(). Fire-and-forget: the response is not
// blocked and unlink failures are irrelevant to the client.
const cleanupTempUploads = (req: Request): void => {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    for (const list of Object.values(req.files)) {
      files.push(...(list as Express.Multer.File[]));
    }
  }
  void Promise.allSettled(
    files.map((file) => (file.path ? unlink(file.path) : Promise.resolve()))
  );
};

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  cleanupTempUploads(req);

  let statusCode = 500;
  let message = "Internal Server Error";

  // Handle known AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
  }

  if (err instanceof MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Image exceeds the ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB limit`
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field"
          : err.message;
  }

  // The authoritative last-owner guard is a database trigger. Surface its
  // check_violation as a clean conflict instead of a 500, whichever code path
  // (deleteUser, bulk delete, raw SQL through Prisma) triggered it.
  const lastOwnerTriggered =
    err instanceof Error &&
    /at least one active super admin must remain/i.test(err.message);

  if (lastOwnerTriggered) {
    statusCode = 409;
    message = "At least one active super admin must remain";
  }

  if (isPrismaKnownRequestError(err) && !lastOwnerTriggered) {
    const mapped = mapPrismaError(err.code);
    if (mapped) {
      statusCode = mapped.statusCode;
      message = mapped.message;
    } else if (err.code === "P2002") {
      statusCode = 409;
      message = "A record with this unique value already exists";
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Related record not found";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    }
  }

  // Log error (important for production debugging)
  const errorMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  const errorStack = err instanceof Error ? err.stack : undefined;
  logger.error({
    message: errorMessage,
    stack: errorStack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.requestId,
    ...(err instanceof AppError && err.code ? { code: err.code } : {}),
    ...(lastOwnerTriggered ? { code: "LAST_SUPER_ADMIN" } : {}),
    ...(err instanceof AppError && err.details !== undefined
      ? { details: err.details }
      : {}),
    ...(process.env.NODE_ENV === "development" && {
      stack: errorStack,
    }),
  });
};

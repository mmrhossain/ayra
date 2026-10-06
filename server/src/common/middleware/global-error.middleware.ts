import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.ts";
import { logger } from "../looger/logger.ts";
import { isPrismaKnownRequestError } from "../utils/prisma-error.ts";
import { MAX_IMAGE_BYTES } from "./upload.middleware.ts";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
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

  if (isPrismaKnownRequestError(err)) {
    if (err.code === "P2002") {
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
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

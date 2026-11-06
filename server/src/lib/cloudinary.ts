import { createReadStream } from "node:fs";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";

import { AppError } from "../common/errors/AppError.ts";
import { env } from "../config/env.ts";
import { logger } from "../common/looger/logger.ts";
import { generateCloudinaryPublicId } from "../common/utils/cloudinary-public-id.ts";

const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;

export const CLOUDINARY_UPLOAD_TIMEOUT_MS = env.CLOUDINARY_UPLOAD_TIMEOUT_MS;
export const CLOUDINARY_DESTROY_TIMEOUT_MS = env.CLOUDINARY_DESTROY_TIMEOUT_MS;
export const CLOUDINARY_RECONCILE_TIMEOUT_MS = env.CLOUDINARY_RECONCILE_TIMEOUT_MS;
export const CLOUDINARY_MAX_ATTEMPTS = 3;
export const CLOUDINARY_DESTROY_MAX_ATTEMPTS = 2;

const isConfigured =
  typeof cloudName === "string" &&
  cloudName.length > 0 &&
  typeof apiKey === "string" &&
  apiKey.length > 0 &&
  typeof apiSecret === "string" &&
  apiSecret.length > 0;

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const assertCloudinaryConfigured = (): void => {
  if (env.NODE_ENV === "test") return;
  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTimeoutError = (error: unknown): boolean =>
  !!error &&
  typeof error === "object" &&
  (error as { name?: string }).name === "TimeoutError";

const isTransientCloudinaryError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    http_code?: number;
    name?: string;
    message?: string;
    code?: string | number;
  };

  if (err.name === "TimeoutError") return true;
  if (
    err.http_code === 429 ||
    err.http_code === 500 ||
    err.http_code === 502 ||
    err.http_code === 503
  ) {
    return true;
  }
  if (typeof err.code === "string") {
    return [
      "ECONNRESET",
      "ETIMEDOUT",
      "EAI_AGAIN",
      "ENOTFOUND",
      "ECONNREFUSED",
    ].includes(err.code);
  }
  const message = (err.message ?? "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("socket hang up")
  );
};

const toUploadError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (
    error &&
    typeof error === "object" &&
    (error as { name?: string }).name === "TimeoutError"
  ) {
    return new AppError("Cloudinary upload timed out", 504);
  }
  return new AppError("Cloudinary upload failed", 502);
};

const withTimeout = <T>(
  operation: Promise<T>,
  ms: number,
  message: string,
): Promise<T> =>
  new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const timeoutError = new Error(message);
      timeoutError.name = "TimeoutError";
      reject(timeoutError);
    }, ms);

    operation.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const resolveUploadTimeout = (options: UploadApiOptions): number =>
  typeof options.timeout === "number" && options.timeout > 0
    ? options.timeout
    : CLOUDINARY_UPLOAD_TIMEOUT_MS;

const uploadOnceFromPath = (
  filePath: string,
  options: UploadApiOptions,
): Promise<UploadApiResponse> => {
  const timeoutMs = resolveUploadTimeout(options);

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
    };

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        ...options,
        timeout: timeoutMs,
      },
      (error, result) => {
        if (settled) return;
        cleanup();

        if (error || !result) {
          reject(error ?? new AppError("Cloudinary upload failed", 502));
          return;
        }
        resolve(result);
      },
    );

    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      stream.removeAllListeners();
      stream.destroy();
      const timeoutError = new Error("Cloudinary upload timed out");
      timeoutError.name = "TimeoutError";
      reject(timeoutError);
    }, timeoutMs);

    stream.on("error", (error) => {
      if (settled) return;
      cleanup();
      reject(error);
    });

    const readStream = createReadStream(filePath);
    readStream.on("error", (error) => {
      if (settled) return;
      cleanup();
      stream.destroy();
      reject(error);
    });
    readStream.pipe(stream);
  });
};

const reconcileUploadedAsset = async (
  publicId: string,
): Promise<UploadApiResponse | null> => {
  try {
    const resource = await withTimeout(
      cloudinary.api.resource(publicId, { resource_type: "image" }),
      CLOUDINARY_RECONCILE_TIMEOUT_MS,
      "Cloudinary reconcile timed out",
    );

    return {
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      url: resource.url,
      bytes: resource.bytes,
      format: resource.format,
    } as UploadApiResponse;
  } catch {
    return null;
  }
};

export const uploadImageFileToCloudinary = async (
  filePath: string,
  options: UploadApiOptions = {},
): Promise<UploadApiResponse> => {
  if (!isConfigured) {
    throw new AppError("Cloudinary is not configured", 500);
  }

  // A fixed public id reused across attempts makes retries idempotent: a timed
  // out upload that actually succeeded is never duplicated, and we can look it
  // up by id to reconcile.
  const publicId =
    typeof options.public_id === "string" && options.public_id.length > 0
      ? options.public_id
      : generateCloudinaryPublicId();

  const uploadOptions: UploadApiOptions = {
    ...options,
    public_id: publicId,
    unique_filename: false,
    overwrite: true,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= CLOUDINARY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await uploadOnceFromPath(filePath, uploadOptions);
    } catch (error) {
      lastError = error;

      // Ambiguous timeout: the request may have completed server-side. Verify by
      // id before treating it as a failure or blindly retrying.
      if (isTimeoutError(error)) {
        const reconciled = await reconcileUploadedAsset(publicId);
        if (reconciled) return reconciled;
      }

      if (
        attempt === CLOUDINARY_MAX_ATTEMPTS ||
        !isTransientCloudinaryError(error)
      ) {
        throw toUploadError(error);
      }
      await sleep(200 * 2 ** (attempt - 1));
    }
  }

  throw toUploadError(lastError);
};

export const deleteCloudinaryAsset = async (
  publicId: string,
): Promise<boolean> => {
  if (!publicId) return true;
  if (!isConfigured) return true;

  for (
    let attempt = 1;
    attempt <= CLOUDINARY_DESTROY_MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      await withTimeout(
        cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
          invalidate: true,
        }),
        CLOUDINARY_DESTROY_TIMEOUT_MS,
        "Cloudinary destroy timed out",
      );
      return true;
    } catch (error) {
      if (
        attempt === CLOUDINARY_DESTROY_MAX_ATTEMPTS ||
        !isTransientCloudinaryError(error)
      ) {
        logger.error({
          message: `Failed to delete Cloudinary asset "${publicId}"`,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
      await sleep(200 * 2 ** (attempt - 1));
    }
  }

  return false;
};

export { cloudinary };

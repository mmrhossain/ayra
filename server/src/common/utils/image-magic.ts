import { open } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../errors/AppError.ts";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT_BY_MIME: Record<string, Set<string>> = {
  "image/jpeg": new Set([".jpg", ".jpeg"]),
  "image/png": new Set([".png"]),
  "image/webp": new Set([".webp"]),
};

const sniffImageMime = (buffer: Buffer): string | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

const assertMimeAndExtension = (
  buffer: Buffer,
  declaredMime: string,
  originalName: string
): void => {
  if (!buffer || buffer.length === 0) {
    throw new AppError("Image file is required", 400);
  }

  const sniffedMime = sniffImageMime(buffer);
  if (!sniffedMime || !ALLOWED_MIME.has(sniffedMime)) {
    throw new AppError(
      "Invalid image content. Only jpg, jpeg, png, and webp are allowed",
      400
    );
  }

  if (declaredMime !== sniffedMime) {
    throw new AppError("Image content does not match the declared file type", 400);
  }

  const ext = path.extname(originalName).toLowerCase();
  const allowedExt = EXT_BY_MIME[sniffedMime];
  if (!allowedExt?.has(ext)) {
    throw new AppError("Image content does not match the file extension", 400);
  }
};

export const assertAllowedImageBuffer = (
  buffer: Buffer | undefined,
  declaredMime: string,
  originalName: string
): void => {
  if (!buffer || buffer.length === 0) {
    throw new AppError("Image file is required", 400);
  }
  assertMimeAndExtension(buffer, declaredMime, originalName);
};

export const assertAllowedImageStream = async (
  filePath: string,
  declaredMime: string,
  originalName: string
): Promise<void> => {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, 16, 0);
    assertMimeAndExtension(buffer.subarray(0, bytesRead), declaredMime, originalName);
  } finally {
    await handle.close();
  }
};

import type { ImageLoaderProps } from "next/image";

const UPLOAD_MARKER = "/image/upload/";

type ParsedCloudinaryUrl = {
  origin: string;
  uploadPath: string;
  version: string | null;
  publicId: string;
  crop?: string;
  gravity?: string;
  width?: number;
  height?: number;
};

export function isCloudinaryUrl(url?: string | null): boolean {
  return Boolean(url && url.includes("cloudinary.com"));
}

function parseCloudinaryUrl(url: string): ParsedCloudinaryUrl | null {
  try {
    const parsed = new URL(url);
    const index = parsed.pathname.indexOf(UPLOAD_MARKER);
    if (index === -1) return null;

    const uploadPath = parsed.pathname.slice(0, index + UPLOAD_MARKER.length);
    const rest = decodeURIComponent(
      parsed.pathname.slice(index + UPLOAD_MARKER.length)
    );
    const parts = rest.split("/").filter(Boolean);
    let version: string | null = null;
    const transformParts: string[] = [];
    const publicParts: string[] = [];

    for (const part of parts) {
      if (/^v\d+$/.test(part) && publicParts.length === 0) {
        version = part;
        continue;
      }
      if (
        publicParts.length === 0 &&
        (part.includes(",") || /^[a-z]+_.+/i.test(part))
      ) {
        transformParts.push(part);
        continue;
      }
      publicParts.push(part);
    }

    if (publicParts.length === 0) return null;

    const flags: Record<string, string> = {};
    for (const group of transformParts) {
      for (const token of group.split(",")) {
        const sep = token.indexOf("_");
        if (sep <= 0) continue;
        flags[token.slice(0, sep)] = token.slice(sep + 1);
      }
    }

    const width = flags.w ? Number(flags.w) : undefined;
    const height = flags.h ? Number(flags.h) : undefined;

    return {
      origin: parsed.origin,
      uploadPath,
      version,
      publicId: publicParts.join("/"),
      crop: flags.c,
      gravity: flags.g,
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
    };
  } catch {
    return null;
  }
}

function buildCloudinaryUrl(
  parsed: ParsedCloudinaryUrl,
  width: number,
  height?: number,
  quality?: number | string
): string {
  const q = quality == null ? "auto" : String(quality);
  const tokens = [`f_auto`, `q_${q}`, `c_limit`, `w_${width}`];
  if (height) tokens.push(`h_${height}`);
  const version = parsed.version ? `${parsed.version}/` : "";
  return `${parsed.origin}${parsed.uploadPath}${tokens.join(",")}/${version}${parsed.publicId}`;
}

export const getOptimizedImage = (
  url?: string | null,
  width = 1200,
  height?: number
): string => {
  if (!url) return "https://placehold.jp/800x800.png";
  if (!isCloudinaryUrl(url)) return url;
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return url;
  return buildCloudinaryUrl(parsed, width, height);
};

export function cloudinaryLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) return src;
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return src;
  return buildCloudinaryUrl(parsed, width, undefined, quality);
}

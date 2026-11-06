type ImageRow = { imageUrl?: string; isPrimary?: boolean };

function isUsableImageUrl(url: string | null | undefined): url is string {
  return Boolean(
    url &&
      (url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/")),
  );
}

function firstValidImageUrl(images?: ImageRow[] | null): string | null {
  if (!images?.length) return null;
  const url = images.find((img) => img.isPrimary)?.imageUrl || images[0]?.imageUrl;
  return isUsableImageUrl(url) ? url : null;
}

export function resolveProductImage(item: {
  productImage?: string | null;
  variant?: {
    product?: { images?: ImageRow[] | null } | null;
  } | null;
}): string | null {
  if (isUsableImageUrl(item.productImage)) return item.productImage;
  return firstValidImageUrl(item.variant?.product?.images);
}

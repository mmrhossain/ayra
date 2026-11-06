import { resolveImagePublicId } from "../../../../common/utils/cloudinary-public-id.ts";
import type { TransactionClient } from "../../../../lib/prisma.ts";
import {
  attachMediaAssets,
  detachMediaAssets,
  type MediaDbClient,
} from "../../../media/media.service.ts";
import type {
  ImageRef,
  ProductImageInput,
  ProductImageRow,
} from "../types/product.types.ts";

export const toProductImageRows = (
  images: ProductImageInput[],
  productId: string,
): ProductImageRow[] =>
  images.map((image, index) => {
    const imageUrl = image.imageUrl ?? image.url ?? "";
    return {
      imageUrl,
      publicId: resolveImagePublicId(image.publicId, imageUrl),
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder ?? index,
      productId,
    };
  });

export const imagePublicIds = (images: ImageRef[]): string[] =>
  images
    .map((image) => resolveImagePublicId(image.publicId, image.imageUrl))
    .filter((id): id is string => Boolean(id));

export const replaceImages = async (
  tx: TransactionClient,
  where: { productId?: string },
  nextRows: ProductImageRow[],
): Promise<string[]> => {
  const previous = await tx.productImage.findMany({
    where,
    select: { publicId: true, imageUrl: true },
  });
  const nextIds = new Set(imagePublicIds(nextRows));
  const staleIds = imagePublicIds(previous).filter((id) => !nextIds.has(id));

  await tx.productImage.deleteMany({ where });
  if (nextRows.length) {
    await tx.productImage.createMany({ data: nextRows });
  }
  return staleIds;
};

export const createProductImages = async (
  tx: TransactionClient,
  productId: string,
  images: ProductImageInput[],
): Promise<void> => {
  if (!images.length) return;
  await tx.productImage.createMany({
    data: toProductImageRows(images, productId),
  });
};

export const attachProductMedia = async (
  publicIds: Array<string | null | undefined>,
  productId: string,
  db?: MediaDbClient,
): Promise<void> => {
  await attachMediaAssets(publicIds, "product", productId, undefined, db);
};

export const detachProductMedia = async (
  publicIds: Array<string | null | undefined>,
  db?: MediaDbClient,
): Promise<void> => {
  await detachMediaAssets(publicIds, db);
};

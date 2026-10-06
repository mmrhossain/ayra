import { AppError } from "../../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../../common/utils/prisma-error.ts";
import { prisma, transaction, type TransactionClient } from "../../../../lib/prisma.ts";
import type {
  CreateVariantInput,
  UpdateVariantInput,
  UpdateVariantPayload,
} from "../types/product.types.ts";
import { validateVariantPayload } from "../utils/product-validation.ts";
import { resolveImagePublicId } from "../../../../common/utils/cloudinary-public-id.ts";
import {
  attachVariantMedia,
  createVariantImages,
  detachProductMedia,
  imagePublicIds,
  replaceImages,
  toVariantImageRows,
} from "./product-image.service.ts";
import {
  createVariantInventories,
  createVariantInventory,
  requireWarehouse,
} from "./product-inventory.service.ts";

export const uniqueFieldConflictMessage = (err: unknown, fallback: string): string => {
  const target = (err as { meta?: { target?: unknown } }).meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  if (fields.some((f) => f.includes("slug"))) return "Product slug already exists";
  if (fields.some((f) => f.includes("sku"))) return "Variant SKU already exists";
  if (fields.some((f) => f.includes("barcode"))) return "Variant barcode already exists";
  return fallback;
};

export const rethrowUniqueConflict = (err: unknown, fallback: string): never => {
  if (isPrismaCode(err, "P2002")) {
    throw new AppError(uniqueFieldConflictMessage(err, fallback), 409);
  }
  throw err;
};

export const unsetOtherDefaultVariants = async (
  tx: TransactionClient,
  productId: string,
  variantId: string,
): Promise<void> => {
  await tx.productVariant.updateMany({
    where: {
      productId,
      deletedAt: null,
      id: { not: variantId },
      isDefault: true,
    },
    data: { isDefault: false },
  });
};

export const ensureDefaultVariant = async (
  tx: TransactionClient,
  productId: string,
  preferredId?: string,
): Promise<void> => {
  const variants = await tx.productVariant.findMany({
    where: { productId, deletedAt: null },
    select: { id: true, isDefault: true },
    orderBy: { createdAt: "asc" },
  });
  if (variants.length === 0) return;

  const preferred =
    (preferredId && variants.some((v) => v.id === preferredId)
      ? preferredId
      : undefined) ??
    variants.find((v) => v.isDefault)?.id ??
    variants[0]?.id;
  if (!preferred) return;

  await unsetOtherDefaultVariants(tx, productId, preferred);
  const current = variants.find((v) => v.id === preferred);
  if (!current?.isDefault) {
    await tx.productVariant.update({
      where: { id: preferred },
      data: { isDefault: true },
    });
  }
};

export const setVariantAttributes = async (
  tx: TransactionClient,
  variantId: string,
  attributeValueIds: string[],
  replace = false,
): Promise<void> => {
  if (replace) {
    await tx.variantAttribute.deleteMany({ where: { variantId } });
  }
  if (!attributeValueIds.length) return;

  const values = await tx.attributeValue.findMany({
    where: { id: { in: attributeValueIds } },
  });
  if (values.length !== attributeValueIds.length) {
    throw new AppError("One or more attribute values not found", 400);
  }

  await tx.variantAttribute.createMany({
    data: attributeValueIds.map((attributeValueId) => ({
      variantId,
      attributeValueId,
    })),
  });
};

export const replaceVariantAttributes = async (
  tx: TransactionClient,
  variantId: string,
  attributeValueIds: string[],
): Promise<void> => {
  await setVariantAttributes(tx, variantId, attributeValueIds, true);
};

export const assertAttributeValuesBelongToAttributes = async (
  tx: TransactionClient,
  groups: Array<{ attributeId: string; attributeValueIds: string[] }>,
): Promise<Map<string, { value: string; attributeId: string }>> => {
  const ids = [...new Set(groups.flatMap((group) => group.attributeValueIds))];
  if (!ids.length) return new Map();

  const values = await tx.attributeValue.findMany({
    where: { id: { in: ids } },
    select: { id: true, value: true, attributeId: true },
  });
  if (values.length !== ids.length) {
    throw new AppError("One or more attribute values not found", 400);
  }

  const byId = new Map(values.map((value) => [value.id, value]));
  for (const group of groups) {
    for (const valueId of group.attributeValueIds) {
      const value = byId.get(valueId);
      if (!value || value.attributeId !== group.attributeId) {
        throw new AppError("Attribute value does not belong to the given attribute", 400);
      }
    }
  }
  return byId;
};

const assertSkuAvailable = async (sku: string, excludeId?: string): Promise<void> => {
  const existingSku = await prisma.productVariant.findFirst({
    where: {
      sku,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existingSku) throw new AppError("Variant SKU already exists", 409);
};

const assertBarcodeAvailable = async (
  barcode: string,
  excludeId?: string,
): Promise<void> => {
  const existingBarcode = await prisma.productVariant.findFirst({
    where: {
      barcode,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existingBarcode) throw new AppError("Variant barcode already exists", 409);
};

export const createVariant = async (productId: string, input: CreateVariantInput) => {
  validateVariantPayload(input);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  await assertSkuAvailable(input.sku);
  if (input.barcode) {
    await assertBarcodeAvailable(input.barcode);
  }

  const { attributeValueIds, images, ...variantData } = input;

  try {
    return await transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          sku: variantData.sku,
          price: variantData.price,
          isDefault: variantData.isDefault,
          productId,
          ...(variantData.barcode !== undefined && { barcode: variantData.barcode }),
          ...(variantData.compareAtPrice !== undefined && {
            compareAtPrice: variantData.compareAtPrice,
          }),
          ...(variantData.costPrice !== undefined && { costPrice: variantData.costPrice }),
          ...(variantData.weight !== undefined && { weight: variantData.weight }),
        },
      });

      if (attributeValueIds?.length) {
        await setVariantAttributes(tx, variant.id, attributeValueIds);
      }

      if (images?.length) {
        await createVariantImages(tx, productId, variant.id, images);
      }

      if (variantData.isDefault) {
        await unsetOtherDefaultVariants(tx, productId, variant.id);
      } else {
        await ensureDefaultVariant(tx, productId);
      }

      const warehouse = await requireWarehouse(tx);
      await createVariantInventory(tx, warehouse.id, variant.id);

      return tx.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
        include: { images: true, attributes: { include: { attributeValue: true } } },
      });
    });
  } catch (err) {
    rethrowUniqueConflict(err, "Variant SKU already exists");
  }
};

export const updateVariant = async (id: string, input: UpdateVariantInput) => {
  validateVariantPayload(input);
  const existing = await prisma.productVariant.findUnique({ where: { id } });
  if (!existing) throw new AppError("Variant not found", 404);

  if (input.sku && input.sku !== existing.sku) {
    await assertSkuAvailable(input.sku, id);
  }
  if (input.barcode && input.barcode !== existing.barcode) {
    await assertBarcodeAvailable(input.barcode, id);
  }

  const { attributeValueIds, images, ...variantData } = input;

  let variant;
  let stalePublicIds: string[] = [];
  try {
    const result = await transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id },
        data: {
          ...(variantData.sku !== undefined && { sku: variantData.sku }),
          ...(variantData.price !== undefined && { price: variantData.price }),
          ...(variantData.isDefault !== undefined && { isDefault: variantData.isDefault }),
          ...(variantData.barcode !== undefined && { barcode: variantData.barcode }),
          ...(variantData.compareAtPrice !== undefined && {
            compareAtPrice: variantData.compareAtPrice,
          }),
          ...(variantData.costPrice !== undefined && { costPrice: variantData.costPrice }),
          ...(variantData.weight !== undefined && { weight: variantData.weight }),
        },
      });

      if (variantData.isDefault === true) {
        await unsetOtherDefaultVariants(tx, existing.productId, id);
      } else if (variantData.isDefault === false) {
        await ensureDefaultVariant(tx, existing.productId);
      }

      if (attributeValueIds) {
        await replaceVariantAttributes(tx, id, attributeValueIds);
      }

      let staleIds: string[] = [];
      if (images) {
        staleIds = await replaceImages(
          tx,
          { variantId: id },
          toVariantImageRows(images, existing.productId, id),
        );
      }

      return { variant: updatedVariant, stalePublicIds: staleIds };
    });
    variant = result.variant;
    stalePublicIds = result.stalePublicIds;
  } catch (err) {
    rethrowUniqueConflict(err, "Variant SKU already exists");
  }

  if (stalePublicIds.length) {
    await detachProductMedia(stalePublicIds);
  }
  if (images) {
    await attachVariantMedia(
      images.map((img) => resolveImagePublicId(img.publicId, img.imageUrl)),
      id,
    );
  }
  return variant;
};

export const deleteVariant = async (id: string) => {
  const existing = await prisma.productVariant.findUnique({
    where: { id },
    include: { images: { select: { publicId: true, imageUrl: true } } },
  });
  if (!existing) throw new AppError("Variant not found", 404);

  const deleted = await transaction(async (tx) => {
    const result = await tx.productVariant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    });
    await ensureDefaultVariant(tx, existing.productId);
    return result;
  });
  await detachProductMedia(imagePublicIds(existing.images));
  return deleted;
};

export const upsertProductVariants = async (
  tx: TransactionClient,
  productId: string,
  variants: UpdateVariantPayload[],
  existingVariants: Array<{ id: string }>,
): Promise<{ preferredDefaultId?: string; staleIds: string[] }> => {
  const warehouse = await requireWarehouse(tx);
  const existingVariantIds = new Set(existingVariants.map((v) => v.id));
  const incomingVariantIds = new Set(
    variants.map((v) => v.id).filter((vId): vId is string => Boolean(vId)),
  );

  const variantsToDelete = existingVariants.filter(
    (v) => !incomingVariantIds.has(v.id),
  );
  if (variantsToDelete.length > 0) {
    await tx.productVariant.updateMany({
      where: { id: { in: variantsToDelete.map((v) => v.id) } },
      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    });
  }

  let preferredDefaultId: string | undefined;
  const staleIds: string[] = [];
  const newVariantIds: string[] = [];

  for (const variantInput of variants) {
    const {
      id: variantId,
      attributeValueIds,
      images: variantImages,
      ...variantData
    } = variantInput;

    let targetVariantId = variantId;

    if (variantId && existingVariantIds.has(variantId)) {
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          ...(variantData.sku !== undefined && { sku: variantData.sku }),
          ...(variantData.price !== undefined && { price: variantData.price }),
          ...(variantData.isDefault !== undefined && {
            isDefault: variantData.isDefault,
          }),
          ...(variantData.barcode !== undefined && {
            barcode: variantData.barcode,
          }),
          ...(variantData.compareAtPrice !== undefined && {
            compareAtPrice: variantData.compareAtPrice,
          }),
          ...(variantData.costPrice !== undefined && {
            costPrice: variantData.costPrice,
          }),
          ...(variantData.weight !== undefined && {
            weight: variantData.weight,
          }),
        },
      });
    } else {
      const newVariant = await tx.productVariant.create({
        data: {
          sku: variantData.sku as string,
          price: variantData.price as number,
          isDefault: variantData.isDefault ?? false,
          productId,
          barcode: variantData.barcode ?? null,
          compareAtPrice: variantData.compareAtPrice ?? null,
          costPrice: variantData.costPrice ?? null,
          weight: variantData.weight ?? null,
        },
      });
      targetVariantId = newVariant.id;
      newVariantIds.push(newVariant.id);
    }

    if (attributeValueIds && targetVariantId) {
      await replaceVariantAttributes(tx, targetVariantId, attributeValueIds);
    }

    if (variantImages && targetVariantId) {
      const nextStale = await replaceImages(
        tx,
        { variantId: targetVariantId },
        toVariantImageRows(variantImages, productId, targetVariantId),
      );
      staleIds.push(...nextStale);
    }

    if (variantData.isDefault && targetVariantId) {
      preferredDefaultId = targetVariantId;
      await unsetOtherDefaultVariants(tx, productId, targetVariantId);
    }
  }

  if (newVariantIds.length) {
    await createVariantInventories(tx, warehouse.id, newVariantIds);
  }

  await ensureDefaultVariant(tx, productId, preferredDefaultId);
  return preferredDefaultId
    ? { preferredDefaultId, staleIds }
    : { staleIds };
};

import { AppError } from "../../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../../common/utils/prisma-error.ts";
import { invalidateCatalogCacheForVariants } from "../../../../lib/cache.ts";
import { prisma, transaction, type TransactionClient } from "../../../../lib/prisma.ts";
import type {
  CreateVariantInput,
  UpdateVariantInput,
  UpdateVariantPayload,
} from "../types/product.types.ts";
import { validateVariantPayload } from "../utils/product-validation.ts";
import { assertTypedSku, buildSuggestedSku, isBlankSku, type SkuAttributeInput } from "../utils/sku-generator.ts";
import {
  attributeValueLookup,
  insertWithGeneratedSkuRetry,
  prefetchTakenSkus,
  resolveVariantSku,
} from "../utils/unique-identity.ts";
import {
  createVariantInventories,
  createVariantInventory,
  requireActiveWarehouses,
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
): Promise<Map<string, { value: string; attributeId: string; attributeName: string }>> => {
  const ids = [...new Set(groups.flatMap((group) => group.attributeValueIds))];
  if (!ids.length) return new Map();

  const values = await tx.attributeValue.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      value: true,
      attributeId: true,
      attribute: { select: { name: true } },
    },
  });
  if (values.length !== ids.length) {
    throw new AppError("One or more attribute values not found", 400);
  }

  const byId = new Map(
    values.map((value) => [
      value.id,
      {
        value: value.value,
        attributeId: value.attributeId,
        attributeName: value.attribute.name,
      },
    ]),
  );
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

const assertBarcodeAvailable = async (
  db: TransactionClient,
  barcode: string,
  excludeId?: string,
): Promise<void> => {
  const existingBarcode = await db.productVariant.findFirst({
    where: {
      barcode,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existingBarcode) throw new AppError("Variant barcode already exists", 409);
};

const productSkuContext = async (
  tx: TransactionClient,
  productId: string,
): Promise<{ categoryName: string; brandName?: string | null | undefined }> => {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });
  if (!product) throw new AppError("Product not found", 404);
  return {
    categoryName: product.category.name,
    brandName: product.brand?.name ?? null,
  };
};

export const createVariant = async (productId: string, input: CreateVariantInput) => {
  validateVariantPayload(input);
  if (!isBlankSku(input.sku)) assertTypedSku(input.sku as string);
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) throw new AppError("Product not found", 404);

  const { attributeValueIds, ...variantData } = input;

  try {
    const created = await transaction(async (tx) => {
      const warehouses = await requireActiveWarehouses(tx);
      const names = await productSkuContext(tx, productId);
      const resolved = await resolveVariantSku(tx, {
        sku: variantData.sku,
        categoryName: names.categoryName,
        brandName: names.brandName,
        attributeValueIds,
      });
      if (variantData.barcode) {
        await assertBarcodeAvailable(tx, variantData.barcode);
      }

      const variant = await insertWithGeneratedSkuRetry(tx, resolved, (sku) =>
        tx.productVariant.create({
          data: {
            sku,
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
        }),
      );

      if (attributeValueIds?.length) {
        await setVariantAttributes(tx, variant.id, attributeValueIds);
      }

      if (variantData.isDefault) {
        await unsetOtherDefaultVariants(tx, productId, variant.id);
      } else {
        await ensureDefaultVariant(tx, productId);
      }

      await createVariantInventory(tx, variant.id, warehouses);

      return tx.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
        include: { attributes: { include: { attributeValue: true } } },
      });
    });
    await invalidateCatalogCacheForVariants([created.id]);
    return created;
  } catch (err) {
    rethrowUniqueConflict(err, "Variant SKU already exists");
  }
};

export const updateVariant = async (id: string, input: UpdateVariantInput) => {
  validateVariantPayload(input);
  if (input.sku !== undefined && !isBlankSku(input.sku)) {
    assertTypedSku(input.sku);
  }
  const existing = await prisma.productVariant.findUnique({ where: { id } });
  if (!existing) throw new AppError("Variant not found", 404);

  const { attributeValueIds, ...variantData } = input;

  let variant;
  try {
    const result = await transaction(async (tx) => {
      let nextSku: string | undefined;
      if (variantData.sku !== undefined) {
        const names = await productSkuContext(tx, existing.productId);
        const resolved = await resolveVariantSku(tx, {
          sku: variantData.sku,
          categoryName: names.categoryName,
          brandName: names.brandName,
          attributeValueIds: attributeValueIds,
          excludeId: id,
        });
        nextSku = resolved.sku;
      }
      // Barcode uniqueness is checked on the transaction client so the read and
      // the write share one snapshot. SKU uniqueness is already enforced by
      // resolveVariantSku above. (Neither alone prevents concurrent duplicates.)
      if (variantData.barcode && variantData.barcode !== existing.barcode) {
        await assertBarcodeAvailable(tx, variantData.barcode, id);
      }
      const updatedVariant = await tx.productVariant.update({
        where: { id },
        data: {
          ...(nextSku !== undefined && { sku: nextSku }),
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

      return { variant: updatedVariant };
    });
    variant = result.variant;
  } catch (err) {
    rethrowUniqueConflict(err, "Variant SKU already exists");
  }

  await invalidateCatalogCacheForVariants([id]);
  return variant;
};

export const deleteVariant = async (id: string) => {
  const existing = await prisma.productVariant.findUnique({ where: { id } });
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
  await invalidateCatalogCacheForVariants([id]);
  return deleted;
};

const variantScalarData = (variantData: Omit<UpdateVariantPayload, "id" | "attributeValueIds">) => ({
  ...(variantData.sku !== undefined && { sku: variantData.sku }),
  ...(variantData.price !== undefined && { price: variantData.price }),
  ...(variantData.isDefault !== undefined && { isDefault: variantData.isDefault }),
  ...(variantData.barcode !== undefined && { barcode: variantData.barcode }),
  ...(variantData.compareAtPrice !== undefined && {
    compareAtPrice: variantData.compareAtPrice,
  }),
  ...(variantData.costPrice !== undefined && { costPrice: variantData.costPrice }),
  ...(variantData.weight !== undefined && { weight: variantData.weight }),
});

const replaceVariantAttributesBatch = async (
  tx: TransactionClient,
  items: Array<{ variantId: string; attributeValueIds: string[] }>,
): Promise<void> => {
  if (!items.length) return;
  await tx.variantAttribute.deleteMany({
    where: { variantId: { in: items.map((item) => item.variantId) } },
  });
  const attributeRows = items.flatMap((item) =>
    item.attributeValueIds.map((attributeValueId) => ({
      variantId: item.variantId,
      attributeValueId,
    })),
  );
  if (!attributeRows.length) return;
  const uniqueIds = [...new Set(attributeRows.map((row) => row.attributeValueId))];
  const values = await tx.attributeValue.findMany({
    where: { id: { in: uniqueIds } },
  });
  if (values.length !== uniqueIds.length) {
    throw new AppError("One or more attribute values not found", 400);
  }
  await tx.variantAttribute.createMany({ data: attributeRows });
};

export type ExistingVariantForUpsert = {
  id: string;
  sku: string;
  price: unknown;
  barcode: string | null;
  compareAtPrice: unknown;
  costPrice: unknown;
  weight: unknown;
  isDefault: boolean;
};

const sameScalar = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) {
    return (a ?? null) === (b ?? null);
  }
  if (typeof a === "boolean" || typeof b === "boolean") {
    return Boolean(a) === Boolean(b);
  }
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  return String(a) === String(b);
};

const variantDataChanged = (
  existing: ExistingVariantForUpsert,
  data: Record<string, unknown>,
): boolean => {
  const entries = Object.entries(data);
  if (!entries.length) return false;
  return entries.some(
    ([field, value]) =>
      !sameScalar((existing as unknown as Record<string, unknown>)[field], value),
  );
};

export const upsertProductVariants = async (
  tx: TransactionClient,
  productId: string,
  variants: UpdateVariantPayload[],
  existingVariants: ExistingVariantForUpsert[],
  names: { categoryName: string; brandName?: string | null | undefined },
): Promise<{ preferredDefaultId?: string }> => {
  const incomingIds = variants
    .map((variant) => variant.id)
    .filter((id): id is string => Boolean(id));
  const duplicateIds = incomingIds.filter(
    (id, index) => incomingIds.indexOf(id) !== index,
  );
  if (duplicateIds.length > 0) {
    throw new AppError("Duplicate variant ids in payload", 400);
  }

  const existingById = new Map(existingVariants.map((v) => [v.id, v]));
  // Every supplied id must belong to a live variant of this product. This
  // rejects unknown, foreign-product, and soft-deleted ids before any
  // replacement write, instead of silently treating them as new variants.
  const unknownIds = incomingIds.filter((id) => !existingById.has(id));
  if (unknownIds.length > 0) {
    throw new AppError("Unknown variant id for this product", 400);
  }

  const incomingVariantIds = new Set(incomingIds);

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

  const toUpdate: UpdateVariantPayload[] = [];
  const toCreate: UpdateVariantPayload[] = [];
  for (const variant of variants) {
    if (variant.id && existingById.has(variant.id)) {
      toUpdate.push(variant);
    } else {
      toCreate.push(variant);
    }
  }

  // B1: resolve attribute values for the whole batch in one query instead of
  // one `skuAttributesForValues` round-trip per generated variant.
  const attributeValueIds = [
    ...new Set(variants.flatMap((variant) => variant.attributeValueIds ?? [])),
  ];
  const attributeLookup = await attributeValueLookup(tx, attributeValueIds);

  const attributesFor = (variant: UpdateVariantPayload): SkuAttributeInput[] => {
    const ids = variant.attributeValueIds ?? [];
    const attributes = ids.map((id) => attributeLookup.get(id));
    if (new Set(ids).size !== ids.length || attributes.some((value) => !value)) {
      throw new AppError("One or more attribute values not found", 400);
    }
    return attributes as SkuAttributeInput[];
  };

  // Prefetch every live SKU a newly-created variant could collide with, so each
  // generated SKU is allocated from this set without its own query.
  const createCandidates = [
    ...new Set(
      toCreate.map((variant) =>
        variant.sku !== undefined && !isBlankSku(variant.sku)
          ? (variant.sku as string)
          : buildSuggestedSku({
              brandName: names.brandName,
              categoryName: names.categoryName,
              attributes: attributesFor(variant),
            }),
      ),
    ),
  ];
  const takenSkus = await prefetchTakenSkus(tx, createCandidates);

  const reservedSkus: string[] = [];
  const resolvedUpdates: Array<{ id: string; input: UpdateVariantPayload }> = [];

  for (const variantInput of toUpdate) {
    const existing = existingById.get(variantInput.id as string);
    const shouldResolveSku = variantInput.sku !== undefined;
    const generatedAttributes =
      shouldResolveSku && isBlankSku(variantInput.sku)
        ? attributesFor(variantInput)
        : undefined;
    const sku = shouldResolveSku
      ? (
          await resolveVariantSku(tx, {
            sku: variantInput.sku,
            categoryName: names.categoryName,
            brandName: names.brandName,
            attributes: generatedAttributes,
            attributeValueIds: variantInput.attributeValueIds,
            excludeId: variantInput.id,
            reservedSkus,
          })
        ).sku
      : existing?.sku;
    if (sku) reservedSkus.push(sku);

    const { id: variantId, attributeValueIds: _attrs, ...variantData } = variantInput;
    const data = variantScalarData({
      ...variantData,
      ...(sku !== undefined && { sku }),
    });
    // B3: skip the write when the payload leaves this variant unchanged.
    if (existing && variantDataChanged(existing, data)) {
      await tx.productVariant.update({
        where: { id: variantId as string },
        data,
      });
    }
    resolvedUpdates.push({
      id: variantId as string,
      input: { ...variantInput, sku },
    });
  }

  // B2: allocate every new SKU first, then insert all new variants in a single
  // `createMany` (plus one lookup for their ids), instead of one query per row.
  const preparedCreates: Array<{ input: UpdateVariantPayload; sku: string }> = [];
  for (const variant of toCreate) {
    const resolved = await resolveVariantSku(tx, {
      sku: variant.sku,
      categoryName: names.categoryName,
      brandName: names.brandName,
      attributes: attributesFor(variant),
      attributeValueIds: variant.attributeValueIds,
      reservedSkus,
      takenSkus,
    });
    reservedSkus.push(resolved.sku);
    preparedCreates.push({ input: variant, sku: resolved.sku });
  }

  const created: Array<{ id: string; sku: string }> = [];
  if (preparedCreates.length) {
    await tx.productVariant.createMany({
      data: preparedCreates.map(({ input, sku }) => ({
        sku,
        price: input.price as number,
        isDefault: input.isDefault ?? false,
        productId,
        barcode: input.barcode ?? null,
        compareAtPrice: input.compareAtPrice ?? null,
        costPrice: input.costPrice ?? null,
        weight: input.weight ?? null,
      })),
    });
    const createdRows = await tx.productVariant.findMany({
      where: {
        productId,
        deletedAt: null,
        sku: { in: preparedCreates.map((item) => item.sku) },
      },
      select: { id: true, sku: true },
    });
    const idBySku = new Map(createdRows.map((row) => [row.sku, row.id]));
    for (const { sku } of preparedCreates) {
      const id = idBySku.get(sku);
      if (!id) throw new AppError("Failed to persist product variant", 500);
      created.push({ id, sku });
    }
  }
  const createdBySku = new Map(created.map((variant) => [variant.sku, variant]));

  const resolved: Array<{ id: string; input: UpdateVariantPayload }> = [
    ...resolvedUpdates,
    ...preparedCreates.map(({ input, sku }) => {
      const createdVariant = createdBySku.get(sku);
      if (!createdVariant) {
        throw new AppError("Failed to persist product variant", 500);
      }
      return { id: createdVariant.id, input: { ...input, sku } };
    }),
  ];

  await replaceVariantAttributesBatch(
    tx,
    resolved.flatMap(({ id, input }) =>
      input.attributeValueIds
        ? [{ variantId: id, attributeValueIds: input.attributeValueIds }]
        : [],
    ),
  );

  const preferredDefaultId = [...resolved]
    .reverse()
    .find((item) => item.input.isDefault)?.id;

  if (created.length) {
    await createVariantInventories(
      tx,
      created.map((variant) => variant.id),
    );
  }

  await ensureDefaultVariant(tx, productId, preferredDefaultId);
  return preferredDefaultId ? { preferredDefaultId } : {};
};

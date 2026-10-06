import { AppError } from "../../../../common/errors/AppError.ts";
import type { TransactionClient } from "../../../../lib/prisma.ts";
import type {
  CreateProductPayload,
  CreateVariantInput,
  GeneratedVariantSpec,
  VariantDefaultsInput,
  VariantOptionGroupInput,
  VariantOverrideInput,
} from "../types/product.types.ts";
import {
  overrideMatchesCombination,
  validateCreateProductPayload,
  validateNoDuplicateCombinations,
} from "../utils/product-validation.ts";
import { ensureUniqueSku, generateSku, makeSkuSegment } from "../utils/sku-generator.ts";
import {
  generateVariantCombinations,
} from "../utils/variant-generator.ts";
import { toVariantImageRows } from "./product-image.service.ts";
import {
  createVariantInventories,
  requireWarehouse,
} from "./product-inventory.service.ts";
import {
  assertAttributeValuesBelongToAttributes,
  ensureDefaultVariant,
} from "./product-variant.service.ts";

const applyOverride = (
  spec: GeneratedVariantSpec,
  overrides: VariantOverrideInput[],
): GeneratedVariantSpec => {
  const match = overrides.find((override) =>
    overrideMatchesCombination(override, spec.attributeValueIds),
  );
  if (!match) return spec;
  const next: GeneratedVariantSpec = {
    ...spec,
    sku: match.sku ?? spec.sku,
    price: match.price ?? spec.price,
    isDefault: match.isDefault ?? spec.isDefault,
  };
  if (match.barcode !== undefined) next.barcode = match.barcode;
  else if (spec.barcode !== undefined) next.barcode = spec.barcode;
  if (match.compareAtPrice !== undefined) next.compareAtPrice = match.compareAtPrice;
  else if (spec.compareAtPrice !== undefined) next.compareAtPrice = spec.compareAtPrice;
  if (match.costPrice !== undefined) next.costPrice = match.costPrice;
  else if (spec.costPrice !== undefined) next.costPrice = spec.costPrice;
  if (match.weight !== undefined) next.weight = match.weight;
  else if (spec.weight !== undefined) next.weight = spec.weight;
  if (match.images !== undefined) next.images = match.images;
  else if (spec.images !== undefined) next.images = spec.images;
  return next;
};

export const buildGeneratedVariantSpecs = async (
  tx: TransactionClient,
  input: {
    productName: string;
    productSku?: string | null;
    variantOptions: VariantOptionGroupInput[];
    variantDefaults: VariantDefaultsInput;
    variantOverrides?: VariantOverrideInput[];
  },
): Promise<GeneratedVariantSpec[]> => {
  const combinations = generateVariantCombinations(input.variantOptions);
  validateNoDuplicateCombinations(combinations.map((c) => c.attributeValueIds));

  const valueMap = await assertAttributeValuesBelongToAttributes(
    tx,
    input.variantOptions,
  );

  const taken = new Set<string>();
  const productSku = input.productSku || makeSkuSegment(input.productName) || "PRODUCT";

  return combinations.map((combo, index) => {
    const labels = combo.attributeValueIds.map(
      (id) => valueMap.get(id)?.value ?? id,
    );
    const spec: GeneratedVariantSpec = {
      sku: generateSku(productSku, labels),
      price: input.variantDefaults.price,
      isDefault: index === 0,
      attributeValueIds: combo.attributeValueIds,
      labels,
    };
    if (input.variantDefaults.compareAtPrice !== undefined) {
      spec.compareAtPrice = input.variantDefaults.compareAtPrice;
    }
    if (input.variantDefaults.costPrice !== undefined) {
      spec.costPrice = input.variantDefaults.costPrice;
    }
    if (input.variantDefaults.weight !== undefined) {
      spec.weight = input.variantDefaults.weight;
    }
    const overridden = applyOverride(spec, input.variantOverrides ?? []);
    return {
      ...overridden,
      sku: ensureUniqueSku(overridden.sku, taken),
    };
  });
};

export const toCreateVariantInputs = (
  specs: GeneratedVariantSpec[],
): CreateVariantInput[] =>
  specs.map((spec) => {
    const input: CreateVariantInput = {
      sku: spec.sku,
      price: spec.price,
      isDefault: spec.isDefault,
      attributeValueIds: spec.attributeValueIds,
    };
    if (spec.barcode !== undefined) input.barcode = spec.barcode;
    if (spec.compareAtPrice !== undefined) input.compareAtPrice = spec.compareAtPrice;
    if (spec.costPrice !== undefined) input.costPrice = spec.costPrice;
    if (spec.weight !== undefined) input.weight = spec.weight;
    if (spec.images !== undefined) input.images = spec.images;
    return input;
  });

const defaultSimpleVariant = (
  productName: string,
  productSku?: string | null,
  defaults?: VariantDefaultsInput,
): CreateVariantInput => {
  const sku = generateSku(productSku || productName, ["DEFAULT"]);
  const input: CreateVariantInput = {
    sku,
    price: defaults?.price ?? 0.01,
    isDefault: true,
  };
  if (defaults?.compareAtPrice !== undefined) input.compareAtPrice = defaults.compareAtPrice;
  if (defaults?.costPrice !== undefined) input.costPrice = defaults.costPrice;
  if (defaults?.weight !== undefined) input.weight = defaults.weight;
  return input;
};

export const resolveCreateVariants = async (
  tx: TransactionClient,
  input: CreateProductPayload,
): Promise<CreateVariantInput[]> => {
  validateCreateProductPayload(input);

  if (input.variantOptions?.length) {
    if (!input.variantDefaults) {
      throw new AppError("variantDefaults is required when variantOptions are provided", 400);
    }
    const specs = await buildGeneratedVariantSpecs(tx, {
      productName: input.name,
      productSku: input.sku ?? null,
      variantOptions: input.variantOptions,
      variantDefaults: input.variantDefaults,
      ...(input.variantOverrides !== undefined && {
        variantOverrides: input.variantOverrides,
      }),
    });
    return toCreateVariantInputs(specs);
  }

  if (input.variants?.length) {
    const taken = new Set<string>();
    return input.variants.map((variant, index) => {
      const sku =
        variant.sku?.trim() ||
        generateSku(input.sku || input.name, variant.attributeValueIds ?? []);
      return {
        ...variant,
        sku: ensureUniqueSku(sku, taken),
        isDefault: variant.isDefault ?? index === 0,
      };
    });
  }

  if (input.variantDefaults) {
    return [defaultSimpleVariant(input.name, input.sku, input.variantDefaults)];
  }

  return [];
};

export const persistGeneratedVariants = async (
  tx: TransactionClient,
  productId: string,
  variants: CreateVariantInput[],
): Promise<void> => {
  if (!variants.length) return;

  const warehouse = await requireWarehouse(tx);
  const created = await tx.productVariant.createManyAndReturn({
    data: variants.map((variant) => ({
      sku: variant.sku,
      price: variant.price,
      isDefault: variant.isDefault ?? false,
      productId,
      barcode: variant.barcode ?? null,
      compareAtPrice: variant.compareAtPrice ?? null,
      costPrice: variant.costPrice ?? null,
      weight: variant.weight ?? null,
    })),
  });
  const createdBySku = new Map(created.map((variant) => [variant.sku, variant]));

  const attributeRows = variants.flatMap((variant) => {
    const createdVariant = createdBySku.get(variant.sku);
    if (!createdVariant) return [];
    return (variant.attributeValueIds ?? []).map((attributeValueId) => ({
      variantId: createdVariant.id,
      attributeValueId,
    }));
  });
  if (attributeRows.length) {
    const uniqueIds = [...new Set(attributeRows.map((row) => row.attributeValueId))];
    const values = await tx.attributeValue.findMany({
      where: { id: { in: uniqueIds } },
    });
    if (values.length !== uniqueIds.length) {
      throw new AppError("One or more attribute values not found", 400);
    }
    await tx.variantAttribute.createMany({ data: attributeRows });
  }

  const imageRows = variants.flatMap((variant) => {
    const createdVariant = createdBySku.get(variant.sku);
    if (!createdVariant || !variant.images?.length) return [];
    return toVariantImageRows(variant.images, productId, createdVariant.id);
  });
  if (imageRows.length) {
    await tx.productImage.createMany({ data: imageRows });
  }

  await createVariantInventories(
    tx,
    warehouse.id,
    created.map((variant) => variant.id),
  );

  const preferredDefault =
    variants.find((variant) => variant.isDefault)?.sku ?? created[0]?.sku;
  const preferredDefaultId = preferredDefault
    ? createdBySku.get(preferredDefault)?.id
    : created[0]?.id;
  await ensureDefaultVariant(tx, productId, preferredDefaultId);
};

export const createSimpleDefaultVariant = async (
  tx: TransactionClient,
  productId: string,
  productName: string,
  productSku?: string | null,
): Promise<void> => {
  await persistGeneratedVariants(tx, productId, [
    defaultSimpleVariant(productName, productSku),
  ]);
};



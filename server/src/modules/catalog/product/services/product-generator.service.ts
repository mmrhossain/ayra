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

type PersistVariantInput = Omit<CreateVariantInput, "sku"> & {
  sku: string;
  skuGenerated?: boolean;
  skuCandidate?: string;
};
import {
  overrideMatchesCombination,
  validateCreateProductPayload,
  validateNoDuplicateCombinations,
} from "../utils/product-validation.ts";
import { buildSuggestedSku, isBlankSku, type SkuAttributeInput } from "../utils/sku-generator.ts";
import {
  attributeValueLookup,
  insertWithGeneratedSkuRetry,
  prefetchTakenSkus,
  resolveVariantSku,
} from "../utils/unique-identity.ts";
import {
  generateVariantCombinations,
} from "../utils/variant-generator.ts";
import { createVariantInventories } from "./product-inventory.service.ts";
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
  return next;
};

export const buildGeneratedVariantSpecs = async (
  tx: TransactionClient,
  input: {
    categoryName: string;
    brandName?: string | null | undefined;
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

  const staged = combinations.map((combo, index) => {
    const labels = combo.attributeValueIds.map(
      (id) => valueMap.get(id)?.value ?? id,
    );
    const spec: GeneratedVariantSpec = {
      sku: "",
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
    const attributes = combo.attributeValueIds.flatMap((id) => {
      const value = valueMap.get(id);
      if (!value) return [];
      return [
        {
          attributeId: value.attributeId,
          attributeName: value.attributeName,
          value: value.value,
        },
      ];
    });
    const explicit = isBlankSku(overridden.sku)
      ? null
      : (overridden.sku as string);
    const candidate = explicit
      ? null
      : buildSuggestedSku({
          brandName: input.brandName,
          categoryName: input.categoryName,
          attributes,
        });
    return { overridden, attributes, explicit, candidate };
  });

  // One query for the whole batch instead of one per variant.
  const takenSkus = await prefetchTakenSkus(tx, [
    ...staged.map((item) => item.explicit),
    ...staged.map((item) => item.candidate),
  ]);

  const reservedSkus: string[] = [];
  const specs: GeneratedVariantSpec[] = [];
  for (const item of staged) {
    const resolved = await resolveVariantSku(tx, {
      sku: item.explicit,
      categoryName: input.categoryName,
      brandName: input.brandName,
      attributes: item.attributes,
      reservedSkus,
      takenSkus,
    });
    reservedSkus.push(resolved.sku);
    specs.push({
      ...item.overridden,
      sku: resolved.sku,
      skuGenerated: resolved.generated,
      skuCandidate: resolved.candidate,
    });
  }
  return specs;
};

export const toCreateVariantInputs = (
  specs: GeneratedVariantSpec[],
): PersistVariantInput[] =>
  specs.map((spec) => {
    const input: PersistVariantInput = {
      sku: spec.sku,
      price: spec.price,
      isDefault: spec.isDefault,
      attributeValueIds: spec.attributeValueIds,
    };
    if (spec.skuGenerated !== undefined) input.skuGenerated = spec.skuGenerated;
    if (spec.skuCandidate !== undefined) input.skuCandidate = spec.skuCandidate;
    if (spec.barcode !== undefined) input.barcode = spec.barcode;
    if (spec.compareAtPrice !== undefined) input.compareAtPrice = spec.compareAtPrice;
    if (spec.costPrice !== undefined) input.costPrice = spec.costPrice;
    if (spec.weight !== undefined) input.weight = spec.weight;
    return input;
  });

const defaultSimpleVariant = async (
  tx: TransactionClient,
  input: {
    categoryName: string;
    brandName?: string | null | undefined;
    defaults?: VariantDefaultsInput;
    reservedSkus?: string[];
  },
): Promise<PersistVariantInput> => {
  const resolved = await resolveVariantSku(tx, {
    categoryName: input.categoryName,
    brandName: input.brandName,
    reservedSkus: input.reservedSkus,
  });
  const variant: PersistVariantInput = {
    sku: resolved.sku,
    price: input.defaults?.price ?? 0.01,
    isDefault: true,
    skuGenerated: resolved.generated,
    skuCandidate: resolved.candidate,
  };
  if (input.defaults?.compareAtPrice !== undefined) {
    variant.compareAtPrice = input.defaults.compareAtPrice;
  }
  if (input.defaults?.costPrice !== undefined) {
    variant.costPrice = input.defaults.costPrice;
  }
  if (input.defaults?.weight !== undefined) {
    variant.weight = input.defaults.weight;
  }
  return variant;
};

export const resolveCreateVariants = async (
  tx: TransactionClient,
  input: CreateProductPayload,
  names: { categoryName: string; brandName?: string | null | undefined },
): Promise<PersistVariantInput[]> => {
  validateCreateProductPayload(input);

  if (input.variantOptions?.length) {
    if (!input.variantDefaults) {
      throw new AppError("variantDefaults is required when variantOptions are provided", 400);
    }
    const specs = await buildGeneratedVariantSpecs(tx, {
      categoryName: names.categoryName,
      brandName: names.brandName,
      variantOptions: input.variantOptions,
      variantDefaults: input.variantDefaults,
      ...(input.variantOverrides !== undefined && {
        variantOverrides: input.variantOverrides,
      }),
    });
    return toCreateVariantInputs(specs);
  }

  if (input.variants?.length) {
    // Resolve attributes for every generated-SKU variant in one query so the
    // prefetch below can cover the whole batch.
    const generatedAttrIds = [
      ...new Set(
        input.variants
          .filter((variant) => isBlankSku(variant.sku))
          .flatMap((variant) => variant.attributeValueIds ?? []),
      ),
    ];
    const attributeLookup = await attributeValueLookup(tx, generatedAttrIds);

    const staged = input.variants.map((variant, index) => {
      const explicit = isBlankSku(variant.sku)
        ? null
        : (variant.sku as string);
      if (explicit) {
        return {
          variant,
          index,
          explicit,
          attributes: [] as SkuAttributeInput[],
          candidate: null as string | null,
        };
      }
      const ids = variant.attributeValueIds ?? [];
      const attributes = ids.map((id) => attributeLookup.get(id));
      if (
        new Set(ids).size !== ids.length ||
        attributes.some((value) => !value)
      ) {
        throw new AppError("One or more attribute values not found", 400);
      }
      const resolvedAttributes = attributes as SkuAttributeInput[];
      const candidate = buildSuggestedSku({
        brandName: names.brandName,
        categoryName: names.categoryName,
        attributes: resolvedAttributes,
      });
      return { variant, index, explicit, attributes: resolvedAttributes, candidate };
    });

    const takenSkus = await prefetchTakenSkus(tx, [
      ...staged.map((item) => item.explicit),
      ...staged.map((item) => item.candidate),
    ]);

    const reservedSkus: string[] = [];
    const prepared: PersistVariantInput[] = [];
    for (const item of staged) {
      const resolved = await resolveVariantSku(tx, {
        sku: item.explicit,
        categoryName: names.categoryName,
        brandName: names.brandName,
        attributeValueIds: item.variant.attributeValueIds,
        attributes: item.attributes,
        reservedSkus,
        takenSkus,
      });
      reservedSkus.push(resolved.sku);
      prepared.push({
        ...item.variant,
        sku: resolved.sku,
        isDefault: item.variant.isDefault ?? item.index === 0,
        skuGenerated: resolved.generated,
        skuCandidate: resolved.candidate,
      });
    }
    return prepared;
  }

  if (input.variantDefaults) {
    return [
      await defaultSimpleVariant(tx, {
        categoryName: names.categoryName,
        brandName: names.brandName,
        defaults: input.variantDefaults,
      }),
    ];
  }

  return [];
};

export const persistGeneratedVariants = async (
  tx: TransactionClient,
  productId: string,
  variants: PersistVariantInput[],
  warehouses?: Array<{ id: string }>,
): Promise<void> => {
  if (!variants.length) return;

  // Insert every variant with a single statement. SKUs were already
  // de-duplicated against the database before the transaction, so conflicts are
  // rare; `skipDuplicates` keeps the transaction usable and lets us retry only
  // the rows that actually collided.
  await tx.productVariant.createMany({
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
    skipDuplicates: true,
  });
  const created: Array<{ id: string; sku: string }> = await tx.productVariant.findMany({
    where: { productId, deletedAt: null },
    select: { id: true, sku: true },
  });
  const createdSkus = new Set(created.map((variant) => variant.sku));

  for (const variant of variants) {
    if (createdSkus.has(variant.sku)) continue;
    const row = await insertWithGeneratedSkuRetry(
      tx,
      {
        sku: variant.sku,
        generated: Boolean(variant.skuGenerated),
        candidate: variant.skuCandidate ?? variant.sku,
      },
      (sku) =>
        tx.productVariant.create({
          data: {
            sku,
            price: variant.price,
            isDefault: variant.isDefault ?? false,
            productId,
            barcode: variant.barcode ?? null,
            compareAtPrice: variant.compareAtPrice ?? null,
            costPrice: variant.costPrice ?? null,
            weight: variant.weight ?? null,
          },
        }),
    );
    variant.sku = row.sku;
    created.push(row);
    createdSkus.add(row.sku);
  }

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

  await createVariantInventories(
    tx,
    created.map((variant) => variant.id),
    warehouses,
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
  names: { categoryName: string; brandName?: string | null | undefined },
): Promise<void> => {
  await persistGeneratedVariants(tx, productId, [
    await defaultSimpleVariant(tx, names),
  ]);
};



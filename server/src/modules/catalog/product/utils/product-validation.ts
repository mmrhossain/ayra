import { AppError } from "../../../../common/errors/AppError.ts";
import type { ProductStatus } from "../../../../generated/prisma/client.ts";
import type {
  CreateProductPayload,
  NestedCreateVariantInput,
  VariantOptionGroupInput,
  VariantOverrideInput,
} from "../types/product.types.ts";
import { makeVariantKey } from "./variant-generator.ts";

const PRODUCT_STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

type Priced = {
  price?: number | undefined;
  compareAtPrice?: number | undefined;
  costPrice?: number | undefined;
  weight?: number | undefined;
};

export const validatePricing = (input: Priced, path = "variant"): void => {
  if (input.price !== undefined && !(input.price > 0)) {
    throw new AppError(`${path} price must be greater than 0`, 400);
  }
  if (input.costPrice !== undefined && input.costPrice < 0) {
    throw new AppError(`${path} costPrice must be greater than or equal to 0`, 400);
  }
  if (input.weight !== undefined && input.weight < 0) {
    throw new AppError(`${path} weight must be greater than or equal to 0`, 400);
  }
  if (
    input.compareAtPrice !== undefined &&
    input.price !== undefined &&
    input.compareAtPrice < input.price
  ) {
    throw new AppError(`${path} compareAtPrice must be greater than or equal to price`, 400);
  }
};

export const validateVariantOptions = (
  groups: VariantOptionGroupInput[],
): void => {
  const attributeIds = new Set<string>();
  for (const group of groups) {
    if (attributeIds.has(group.attributeId)) {
      throw new AppError("Duplicate attribute groups are not allowed", 400);
    }
    attributeIds.add(group.attributeId);

    const values = new Set<string>();
    for (const valueId of group.attributeValueIds) {
      if (values.has(valueId)) {
        throw new AppError("Duplicate attribute values are not allowed", 400);
      }
      values.add(valueId);
    }
  }
};

export const validateNoDuplicateCombinations = (
  combinations: string[][],
): void => {
  const seen = new Set<string>();
  for (const ids of combinations) {
    const key = makeVariantKey(ids);
    if (seen.has(key)) {
      throw new AppError("Duplicate variant combination", 400);
    }
    seen.add(key);
  }
};

export const validateDefaultVariantCount = (
  variants: Array<{ isDefault?: boolean | undefined }>,
): void => {
  const defaults = variants.filter((variant) => variant.isDefault).length;
  if (defaults > 1) {
    throw new AppError("A product can have at most one default variant", 400);
  }
};

export const validateProductStatus = (status?: ProductStatus): void => {
  if (status !== undefined && !PRODUCT_STATUSES.includes(status)) {
    throw new AppError("Invalid product status", 400);
  }
};

export const validateCreateProductPayload = (input: CreateProductPayload): void => {
  if (!input.name.trim()) {
    throw new AppError("Product name is required", 400);
  }
  if (input.slug !== undefined && !input.slug.trim()) {
    throw new AppError("Product slug is required", 400);
  }
  if (!input.categoryId) {
    throw new AppError("categoryId is required", 400);
  }
  validateProductStatus(input.status);
  if (input.variantOptions?.length) {
    validateVariantOptions(input.variantOptions);
  }
  if (input.variantDefaults) {
    validatePricing(input.variantDefaults, "variantDefaults");
  }
  if (input.variants?.length) {
    validateDefaultVariantCount(input.variants);
    for (const variant of input.variants) {
      validatePricing(variant);
    }
  }
  if (input.variantOverrides?.length) {
    for (const override of input.variantOverrides) {
      validatePricing(override, "variantOverride");
    }
  }
  if (input.variants?.length && input.variantOptions?.length) {
    throw new AppError("Provide either variants or variantOptions, not both", 400);
  }
};

export const validateVariantPayload = (input: Priced): void => {
  validatePricing(input);
};

export const overrideMatchesCombination = (
  override: VariantOverrideInput,
  attributeValueIds: string[],
): boolean => {
  const combo = new Set(attributeValueIds);
  return override.attributeValueIds.every((id) => combo.has(id));
};

export type { NestedCreateVariantInput };

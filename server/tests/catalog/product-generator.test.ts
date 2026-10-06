import { describe, expect, it } from "vitest";
import { AppError } from "../../src/common/errors/AppError.ts";
import { resolveProductStatus } from "../../src/modules/catalog/product/types/product.types.ts";
import {
  validateCreateProductPayload,
  validateNoDuplicateCombinations,
  validatePricing,
  validateVariantOptions,
} from "../../src/modules/catalog/product/utils/product-validation.ts";
import { generateSku, ensureUniqueSku } from "../../src/modules/catalog/product/utils/sku-generator.ts";
import {
  generateVariantCombinations,
  makeVariantKey,
} from "../../src/modules/catalog/product/utils/variant-generator.ts";

describe("variant-generator", () => {
  it("builds cartesian combinations for color and size", () => {
    const combos = generateVariantCombinations([
      { attributeId: "color", attributeValueIds: ["red", "blue", "black"] },
      { attributeId: "size", attributeValueIds: ["s", "m", "l"] },
    ]);
    expect(combos).toHaveLength(9);
    expect(combos.map((c) => c.attributeValueIds.join("-"))).toEqual([
      "red-s",
      "red-m",
      "red-l",
      "blue-s",
      "blue-m",
      "blue-l",
      "black-s",
      "black-m",
      "black-l",
    ]);
  });

  it("builds combinations for three attribute groups", () => {
    const combos = generateVariantCombinations([
      { attributeId: "color", attributeValueIds: ["red", "blue"] },
      { attributeId: "size", attributeValueIds: ["s", "m"] },
      { attributeId: "fabric", attributeValueIds: ["cotton"] },
    ]);
    expect(combos).toHaveLength(4);
    expect(combos.map((c) => c.attributeValueIds.join("-"))).toEqual([
      "red-s-cotton",
      "red-m-cotton",
      "blue-s-cotton",
      "blue-m-cotton",
    ]);
  });

  it("works with a single attribute group", () => {
    const combos = generateVariantCombinations([
      { attributeId: "color", attributeValueIds: ["red", "blue", "black"] },
    ]);
    expect(combos.map((c) => c.attributeValueIds.join("-"))).toEqual([
      "red",
      "blue",
      "black",
    ]);
  });

  it("deduplicates combinations via a stable key", () => {
    expect(makeVariantKey(["b", "a"])).toBe("a|b");
    const combos = generateVariantCombinations([
      { attributeId: "color", attributeValueIds: ["red", "red"] },
    ]);
    expect(combos).toHaveLength(1);
  });
});

describe("sku-generator", () => {
  it("builds uppercase URL-safe SKUs", () => {
    expect(generateSku("tshirt", ["Red", "M"])).toBe("TSHIRT-RED-M");
  });

  it("avoids duplicate SKUs", () => {
    const taken = new Set<string>();
    expect(ensureUniqueSku("TSHIRT-RED-M", taken)).toBe("TSHIRT-RED-M");
    expect(ensureUniqueSku("TSHIRT-RED-M", taken)).toBe("TSHIRT-RED-M-2");
  });

  it("builds a default simple-product SKU", () => {
    expect(generateSku("Leather Wallet", ["DEFAULT"])).toBe("LEATHER-WALLET-DEFAULT");
  });
});

describe("product-validation", () => {
  it("rejects compareAtPrice below price", () => {
    expect(() => validatePricing({ price: 1200, compareAtPrice: 1000 })).toThrow(AppError);
  });

  it("rejects duplicate attribute groups and values", () => {
    expect(() =>
      validateVariantOptions([
        { attributeId: "color", attributeValueIds: ["red"] },
        { attributeId: "color", attributeValueIds: ["blue"] },
      ]),
    ).toThrow(/Duplicate attribute groups/);
    expect(() =>
      validateVariantOptions([
        { attributeId: "color", attributeValueIds: ["red", "red"] },
      ]),
    ).toThrow(/Duplicate attribute values/);
  });

  it("rejects duplicate variant combinations", () => {
    expect(() =>
      validateNoDuplicateCombinations([
        ["red", "m"],
        ["m", "red"],
      ]),
    ).toThrow(/Duplicate variant combination/);
  });

  it("rejects mixing explicit variants with generated options", () => {
    expect(() =>
      validateCreateProductPayload({
        name: "Tee",
        slug: "tee",
        categoryId: "cat",
        isFeatured: false,
        variants: [{ price: 1000, isDefault: true }],
        variantOptions: [{ attributeId: "color", attributeValueIds: ["red"] }],
      }),
    ).toThrow(/either variants or variantOptions/);
  });
});

describe("resolveProductStatus", () => {
  it("uses status when provided and otherwise defaults to DRAFT", () => {
    expect(resolveProductStatus("ACTIVE")).toBe("ACTIVE");
    expect(resolveProductStatus("ARCHIVED")).toBe("ARCHIVED");
    expect(resolveProductStatus(undefined)).toBe("DRAFT");
  });
});

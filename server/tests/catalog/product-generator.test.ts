import { describe, expect, it } from "vitest";
import { AppError } from "../../src/common/errors/AppError.ts";
import { resolveProductStatus } from "../../src/modules/catalog/product/types/product.types.ts";
import {
  validateCreateProductPayload,
  validateNoDuplicateCombinations,
  validatePricing,
  validateVariantOptions,
} from "../../src/modules/catalog/product/utils/product-validation.ts";
import {
  assertTypedSku,
  buildSuggestedSku,
  ensureUniqueSku,
} from "../../src/modules/catalog/product/utils/sku-generator.ts";
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

  it("rejects more than 100 combinations", () => {
    expect(() =>
      generateVariantCombinations([
        { attributeId: "a", attributeValueIds: Array.from({ length: 10 }, (_, i) => `a${i}`) },
        { attributeId: "b", attributeValueIds: Array.from({ length: 11 }, (_, i) => `b${i}`) },
      ]),
    ).toThrow(/Too many variant combinations/);
  });
});

describe("sku-generator", () => {
  const colorSize = [
    { attributeId: "size", attributeName: "Size", value: "M" },
    { attributeId: "color", attributeName: "Color", value: "Black" },
  ];

  it("builds Brand-Style-Color-Size SKUs", () => {
    expect(
      buildSuggestedSku({
        brandName: "Nike",
        categoryName: "T-shirt",
        attributes: colorSize,
      }),
    ).toBe("NIK-TSH-BLK-M");
  });

  it("uses DEFAULT_BRAND_PREFIX when brand is empty", () => {
    expect(
      buildSuggestedSku({
        categoryName: "T-shirt",
        attributes: colorSize,
      }),
    ).toBe("AYR-TSH-BLK-M");
  });

  it("orders Color then Size regardless of input order", () => {
    expect(
      buildSuggestedSku({
        brandName: "Ayra",
        categoryName: "Tee",
        attributes: colorSize,
      }),
    ).toBe("AYR-TSH-BLK-M");
  });

  it("appends extra attributes after Color and Size", () => {
    expect(
      buildSuggestedSku({
        brandName: "Ayra",
        categoryName: "T-shirt",
        attributes: [
          ...colorSize,
          { attributeId: "mat", attributeName: "Material", value: "Cotton" },
          { attributeId: "fit", attributeName: "Fit", value: "Regular" },
        ],
      }),
    ).toBe("AYR-TSH-BLK-M-REG-COT");
  });

  it("uses three-letter mnemonics for unknown color and category", () => {
    const sku = buildSuggestedSku({
      brandName: "Nike",
      categoryName: "Wallet",
      attributes: [{ attributeId: "color", attributeName: "Color", value: "Turquoise" }],
    });
    expect(sku).toBe("NIK-WLT-TUR");
    expect(sku.includes("WALLET")).toBe(false);
    expect(sku.includes("TURQUOISE")).toBe(false);
  });

  it("rejects invalid typed SKUs without rewriting", () => {
    for (const sku of ["AYR--TSH", "-AYR", "AYR-TSH-", "AYR_TSH", " AYR-TSH"]) {
      expect(() => assertTypedSku(sku)).toThrow(AppError);
      try {
        assertTypedSku(sku);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).message).toBe("Invalid SKU");
      }
    }
  });

  it("accepts mixed-case typed SKUs as-is", () => {
    expect(() => assertTypedSku("nike-001")).not.toThrow();
  });

  it("still suffixes in-memory generated collisions", () => {
    const taken = new Set<string>();
    expect(ensureUniqueSku("AYR-TSH-BLK-M", taken)).toBe("AYR-TSH-BLK-M");
    expect(ensureUniqueSku("AYR-TSH-BLK-M", taken)).toBe("AYR-TSH-BLK-M-2");
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

import { describe, expect, it } from "vitest";
import { AppError } from "../../src/common/errors/AppError.ts";
import {
  assertTypedSku,
  brandCode,
  buildSuggestedSku,
  DEFAULT_BRAND_PREFIX,
  styleCode,
} from "../../src/modules/catalog/product/utils/sku-generator.ts";

describe("buildSuggestedSku", () => {
  const blackM = [
    { attributeId: "size-1", attributeName: "Size", value: "M" },
    { attributeId: "color-1", attributeName: "Color", value: "Black" },
  ];

  it("uses the selected brand prefix", () => {
    expect(
      buildSuggestedSku({
        brandName: "Nike",
        categoryName: "T-shirt",
        attributes: blackM,
      }),
    ).toBe("NIK-TSH-BLK-M");
  });

  it("falls back to DEFAULT_BRAND_PREFIX when brand is empty", () => {
    expect(DEFAULT_BRAND_PREFIX).toBe("AYR");
    expect(brandCode(null)).toBe("AYR");
    expect(brandCode("")).toBe("AYR");
    expect(brandCode("HM")).toBe("HM");
    expect(
      buildSuggestedSku({
        categoryName: "T-shirt",
        attributes: blackM,
      }),
    ).toBe("AYR-TSH-BLK-M");
  });

  it("keeps Color before Size even when Size is listed first", () => {
    expect(
      buildSuggestedSku({
        brandName: "Ayra",
        categoryName: "Tee",
        attributes: blackM,
      }),
    ).toBe("AYR-TSH-BLK-M");
  });

  it("appends remaining attributes A-Z after Color and Size", () => {
    expect(
      buildSuggestedSku({
        brandName: "Ayra",
        categoryName: "T-shirt",
        attributes: [
          { attributeId: "fit", attributeName: "Fit", value: "Regular" },
          { attributeId: "size", attributeName: "Size", value: "M" },
          { attributeId: "mat", attributeName: "Material", value: "Cotton" },
          { attributeId: "color", attributeName: "Colour", value: "Black" },
        ],
      }),
    ).toBe("AYR-TSH-BLK-M-REG-COT");
  });

  it("uses three-letter mnemonics for unknown color and category", () => {
    expect(styleCode("Wallet")).toBe("WLT");
    const sku = buildSuggestedSku({
      brandName: "Nike",
      categoryName: "Wallet",
      attributes: [
        { attributeId: "color", attributeName: "Color", value: "Turquoise" },
      ],
    });
    expect(sku).toBe("NIK-WLT-TUR");
    expect(sku).not.toContain("WALLET");
    expect(sku).not.toContain("TURQUOISE");
  });

  it("omits attribute segments when there are none", () => {
    expect(buildSuggestedSku({ brandName: "Nike", categoryName: "Hoodie" })).toBe(
      "NIK-HDI",
    );
  });
});

describe("assertTypedSku", () => {
  it("rejects invalid typed SKUs with 400 and leaves the value unchanged", () => {
    for (const sku of ["AYR--TSH", "-AYR", "AYR-TSH-", "AYR_TSH", " AYR-TSH", "AYR-TSH "]) {
      try {
        assertTypedSku(sku);
        throw new Error(`expected ${sku} to fail`);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect(sku).toBe(sku);
      }
    }
  });

  it("accepts mixed-case typed SKUs as-is", () => {
    expect(() => assertTypedSku("nike-001")).not.toThrow();
    expect(() => assertTypedSku("AYR-TSH-BLK-M")).not.toThrow();
    expect(() => assertTypedSku("AYR123")).not.toThrow();
  });
});

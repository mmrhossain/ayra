import { describe, expect, it } from "vitest";
import {
  buildAttributeFilterConditions,
  parseAttributesParam,
  parseCategoriesParam,
} from "../../src/modules/catalog/product/utils/product-filter-params.ts";

describe("parseAttributesParam", () => {
  it("parses multiple groups with multiple values", () => {
    expect(parseAttributesParam("colour:a,b~size:c")).toEqual([
      { attributeId: "colour", valueIds: ["a", "b"] },
      { attributeId: "size", valueIds: ["c"] },
    ]);
  });

  it("accepts array input (repeated query param)", () => {
    expect(parseAttributesParam(["colour:a", "size:c"])).toEqual([
      { attributeId: "colour", valueIds: ["a"] },
      { attributeId: "size", valueIds: ["c"] },
    ]);
  });

  it("drops malformed chunks", () => {
    expect(parseAttributesParam("colour:a~broken~:x~size:")).toEqual([
      { attributeId: "colour", valueIds: ["a"] },
    ]);
  });

  it("returns empty for undefined", () => {
    expect(parseAttributesParam(undefined)).toEqual([]);
  });
});

describe("parseCategoriesParam", () => {
  it("splits and trims slugs", () => {
    expect(parseCategoriesParam("cotton, silk ,jamdani")).toEqual([
      "cotton",
      "silk",
      "jamdani",
    ]);
  });

  it("accepts array input", () => {
    expect(parseCategoriesParam(["cotton", "silk"])).toEqual(["cotton", "silk"]);
  });

  it("returns empty for undefined", () => {
    expect(parseCategoriesParam(undefined)).toEqual([]);
  });
});

describe("buildAttributeFilterConditions", () => {
  it("builds one variant-scoped condition per group", () => {
    const conditions = buildAttributeFilterConditions([
      { attributeId: "colour", valueIds: ["a", "b"] },
    ]);
    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toEqual({
      variants: {
        some: {
          deletedAt: null,
          attributes: {
            some: {
              attributeValue: { attributeId: "colour", id: { in: ["a", "b"] } },
            },
          },
        },
      },
    });
  });

  it("returns empty array for no groups", () => {
    expect(buildAttributeFilterConditions([])).toEqual([]);
  });
});

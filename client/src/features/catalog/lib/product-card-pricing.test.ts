import { describe, expect, it } from "vitest";
import { productCardPricing } from "./product-card-pricing";
describe("product card pricing", () => {
  it("uses the cheapest variant and its own compare-at price", () => {
    expect(productCardPricing({ variants: [
      { id: "expensive", price: 1200, compareAtPrice: 2000 },
      { id: "sale", price: 800, compareAtPrice: 1000 },
    ] })).toEqual({ variantId: "sale", price: 800, compareAt: 1000, discountPct: 20 });
  });
  it("does not invent a discount from another variant's reference price", () => {
    expect(productCardPricing({ variants: [
      { id: "sale", price: 1200, compareAtPrice: 2000 },
      { id: "regular", price: 800 },
    ] })).toEqual({ variantId: "regular", price: 800, compareAt: null, discountPct: 0 });
  });
  it("handles missing and invalid prices without displaying NaN", () => {
    expect(productCardPricing({ variants: [] })).toEqual({ variantId: null, price: null, compareAt: null, discountPct: 0 });
    expect(productCardPricing({ variants: [{ id: "bad", price: "bad" }, { id: "good", price: "500", compareAtPrice: "1000" }] })).toMatchObject({ variantId: "good", price: 500, discountPct: 50 });
  });
});

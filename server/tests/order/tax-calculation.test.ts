import { describe, expect, it } from "vitest";
import { lineAmountsForRange } from "../../src/modules/order/utils/order-helpers.ts";
import { calculateTaxTotals } from "../../src/modules/tax/tax-calculation.ts";
const classes = [
  { id: "standard", name: "Standard VAT", code: "STANDARD", rate: 15, isActive: true },
  { id: "reduced", name: "Reduced VAT", code: "REDUCED", rate: 5, isActive: true },
  { id: "inactive", name: "Inactive", code: "INACTIVE", rate: 20, isActive: false },
];
const behavior = { taxEnabled: true };
describe("product tax class calculations", () => {
  it("applies mixed rates after allocating discount and excludes shipping from tax", () => {
    const result = calculateTaxTotals([
      { unitPrice: 100, quantity: 2, taxClassId: "standard" },
      { unitPrice: 100, quantity: 1, taxClassId: "reduced" },
    ], 30, classes, behavior, 60);
    expect(result).toMatchObject({ subtotal: 300, discountAmount: 30, taxAmount: 31.5, shippingAmount: 60, grandTotal: 361.5 });
    expect(result.allocations).toEqual([
      { grossMinor: 20000, discountMinor: 2000, taxMinor: 2700, taxClassName: "Standard VAT", taxRate: 15 },
      { grossMinor: 10000, discountMinor: 1000, taxMinor: 450, taxClassName: "Reduced VAT", taxRate: 5 },
    ]);
  });
  it("keeps category or product restricted discounts on eligible lines", () => {
    const result = calculateTaxTotals([
      { unitPrice: 100, quantity: 1, taxClassId: "standard", discountEligible: true },
      { unitPrice: 100, quantity: 1, taxClassId: "reduced", discountEligible: false },
    ], 20, classes, behavior);
    expect(result.allocations.map(line => line.discountMinor)).toEqual([2000, 0]);
    expect(result.taxAmount).toBe(17);
    expect(result.grandTotal).toBe(197);
  });
  it("uses zero tax for unassigned, inactive, and missing classes", () => {
    const result = calculateTaxTotals([null, "inactive", "missing"].map(taxClassId => ({ unitPrice: 100, quantity: 1, taxClassId })), 0, classes, behavior);
    expect(result.taxAmount).toBe(0);
    expect(result.grandTotal).toBe(300);
  });
  it("disabling tax overrides assigned rates without hiding the class snapshot", () => {
    const result = calculateTaxTotals([{ unitPrice: 100, quantity: 1, taxClassId: "standard" }], 0, classes, { ...behavior, taxEnabled: false });
    expect(result).toMatchObject({ taxAmount: 0, grandTotal: 100 });
    expect(result.allocations[0]).toMatchObject({ taxClassName: "Standard VAT", taxRate: 0 });
  });
  it("reconciles rounding for small fractional prices and discounts", () => {
    const result = calculateTaxTotals([
      { unitPrice: 0.33, quantity: 3, taxClassId: "standard" },
      { unitPrice: 0.17, quantity: 5, taxClassId: "reduced" },
      { unitPrice: 0.29, quantity: 7, taxClassId: "standard" },
    ], 0.11, classes, behavior);
    expect(result.allocations.reduce((sum, line) => sum + line.discountMinor, 0)).toBe(11);
    expect(result.allocations.reduce((sum, line) => sum + line.taxMinor, 0)).toBe(Math.round(result.taxAmount * 100));
    expect(Math.round(result.grandTotal * 100)).toBe(Math.round(result.subtotal * 100) - 11 + Math.round(result.taxAmount * 100));
  });
  it("caps discounts, keeps empty carts at zero, and applies free shipping only to shipping", () => {
    const lines = [{ unitPrice: 100, quantity: 1, taxClassId: "standard" }];
    expect(calculateTaxTotals(lines, 200, classes, behavior, 60)).toMatchObject({ discountAmount: 100, taxAmount: 0, grandTotal: 60 });
    expect(calculateTaxTotals(lines, 0, classes, behavior, 60, true)).toMatchObject({ taxAmount: 15, shippingAmount: 0, grandTotal: 115 });
    expect(calculateTaxTotals([], 0, classes, behavior)).toMatchObject({ subtotal: 0, taxAmount: 0, grandTotal: 0 });
  });
});

describe("historical order pricing", () => {
  it("preserves refunds and net sales for historical tax-inclusive orders", () => {
    const result = lineAmountsForRange(
      { subtotal: 110, discountAmount: 0, taxAmount: 10, pricesIncludeTax: true },
      { unitPrice: 110, quantity: 1, discountAmount: 0, taxAmount: 10, allocationVersion: 1 },
      0, 1,
    );
    expect(result).toMatchObject({ taxMinor: 1000, netSalesMinor: 10000, cashRefundMinor: 11000 });
  });
});

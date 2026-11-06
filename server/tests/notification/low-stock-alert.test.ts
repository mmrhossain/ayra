import { describe, expect, it } from "vitest";
import {
  buildLowStockTable,
  LOW_STOCK_ALERT_TEMPLATE,
} from "../../src/template/low-stock-alert.ts";
import { isLowStockTrigger } from "../../src/modules/catalog/inventory/utils/low-stock.ts";

describe("Low stock alerts", () => {
  it("renders a row per item and escapes product data", () => {
    const html = buildLowStockTable([
      {
        productName: "Silk <Scarf>",
        sku: "SKU-1",
        warehouseName: "Main & Co",
        quantityAvailable: 3,
      },
      {
        productName: "Leather Bag",
        sku: "SKU-2",
        warehouseName: "Main Warehouse",
        quantityAvailable: 0,
      },
    ]);

    expect(html).toContain("Silk &lt;Scarf&gt;");
    expect(html).toContain("Main &amp; Co");
    expect(html).toContain("3 left");
    expect(html).toContain("Out of stock");
    expect(html).not.toContain("<Scarf>");
  });

  it("targets administrators with a restock call to action", () => {
    expect(LOW_STOCK_ALERT_TEMPLATE.code).toBe("LOW_STOCK_ALERT");
    expect(LOW_STOCK_ALERT_TEMPLATE.content).toContain(
      "Review inventory",
    );
    expect(LOW_STOCK_ALERT_TEMPLATE.variables).toContain("itemsTable");
  });

  it("fires when stock crosses below the threshold", () => {
    expect(isLowStockTrigger(12, 8, 10)).toBe(true);
    expect(isLowStockTrigger(10, 9, 10)).toBe(true);
  });

  it("does not repeat alerts while stock stays in the low band", () => {
    expect(isLowStockTrigger(8, 5, 10)).toBe(false);
  });

  it("fires when a variant sells out", () => {
    expect(isLowStockTrigger(2, 0, 10)).toBe(true);
  });

  it("stays quiet for restocks and no-ops", () => {
    expect(isLowStockTrigger(2, 30, 10)).toBe(false);
    expect(isLowStockTrigger(8, 8, 10)).toBe(false);
  });
});

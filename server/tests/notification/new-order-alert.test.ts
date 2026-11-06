import { describe, expect, it } from "vitest";
import { NEW_ORDER_ALERT_TEMPLATE } from "../../src/template/new-order-alert.ts";

describe("New order alert", () => {
  it("targets administrators with the order summary", () => {
    expect(NEW_ORDER_ALERT_TEMPLATE.code).toBe("NEW_ORDER_ALERT");
    expect(NEW_ORDER_ALERT_TEMPLATE.subject).toContain("{{orderNumber}}");
    expect(NEW_ORDER_ALERT_TEMPLATE.subject).toContain("{{grandTotal}}");
    expect(NEW_ORDER_ALERT_TEMPLATE.content).toContain("Open orders");
    expect(NEW_ORDER_ALERT_TEMPLATE.variables).toEqual(
      expect.arrayContaining([
        "adminName",
        "customerEmail",
        "itemsTable",
        "summaryTable",
        "orderUrl",
      ]),
    );
  });
});

import { describe, expect, it } from "vitest";
import { toOrderStatusPreview } from "./status-preview";

describe("order status preview", () => {
  it("includes the warehouse fulfillment stages", () => {
    const preview = toOrderStatusPreview("READY_TO_SHIP");

    expect(preview.steps.map((step) => step.status)).toEqual([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PICKING",
      "PACKED",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
    ]);
    expect(preview.currentIndex).toBe(5);
  });
});

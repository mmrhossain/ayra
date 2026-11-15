import { describe, expect, it } from "vitest";
import { formatOrderNumber } from "../../src/modules/order/utils/order-helpers.ts";

describe("formatOrderNumber", () => {
  it("formats date-stamped order references with a six-digit sequence", () => {
    expect(
      formatOrderNumber(42n, new Date("2026-11-15T00:00:00.000Z")),
    ).toBe("AYR-261115-000016");
  });

  it("rejects values outside the supported reference width", () => {
    expect(() => formatOrderNumber(0n)).toThrow(RangeError);
    expect(() => formatOrderNumber(2_176_782_336n)).toThrow(RangeError);
  });
});

import { describe, expect, it } from "vitest";
import { formatOrderNumber } from "../../src/modules/order/utils/order-helpers.ts";

describe("formatOrderNumber", () => {
  it.each([
    [1n, "001"],
    [2n, "002"],
    [3n, "003"],
    [42n, "042"],
    [999n, "999"],
    [1000n, "1000"],
    [2176782335n, "2176782335"],
  ])("formats decimal sequence %s without truncation", (reference, suffix) => {
    expect(
      formatOrderNumber(reference, new Date("2026-11-19T00:00:00.000Z")),
    ).toBe("AYR-261119-" + suffix);
  });
  it("rejects values outside the supported sequence range", () => {
    expect(() => formatOrderNumber(0n)).toThrow(RangeError);
    expect(() => formatOrderNumber(2_176_782_336n)).toThrow(RangeError);
  });
});

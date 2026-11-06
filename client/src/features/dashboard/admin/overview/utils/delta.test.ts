import { describe, expect, it } from "vitest";

import { formatDelta, percentChange } from "./delta";

describe("percentChange", () => {
  it("returns null when there is no previous baseline", () => {
    expect(percentChange(100, null)).toBeNull();
    expect(percentChange(100, 0)).toBeNull();
  });

  it("computes growth and decline", () => {
    expect(percentChange(150, 100)).toBeCloseTo(50);
    expect(percentChange(50, 100)).toBeCloseTo(-50);
    expect(percentChange(0, 100)).toBeCloseTo(-100);
  });
});

describe("formatDelta", () => {
  it("labels missing baselines", () => {
    expect(formatDelta(null)).toBe("No prior data");
  });

  it("signs the percentage", () => {
    expect(formatDelta(12.3)).toBe("+12.3%");
    expect(formatDelta(-4)).toBe("-4.0%");
    expect(formatDelta(0)).toBe("0.0%");
  });
});

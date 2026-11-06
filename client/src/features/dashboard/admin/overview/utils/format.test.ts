import { describe, expect, it } from "vitest";

import { NUM, formatMetric, moneyFormatter } from "./format";

describe("metric formatting", () => {
  it("formats money in the given currency", () => {
    expect(moneyFormatter("BDT").format(1500)).toContain("1,500");
  });

  it("formats counts with grouping", () => {
    expect(NUM.format(1284)).toBe("1,284");
  });

  it("dispatches on the metric format", () => {
    expect(formatMetric(1500, "money", "BDT")).toContain("1,500");
    expect(formatMetric(12.34, "percent", "BDT")).toBe("12.3%");
    expect(formatMetric(1284, "count", "BDT")).toBe("1,284");
  });
});

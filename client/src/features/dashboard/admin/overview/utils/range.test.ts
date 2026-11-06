import { describe, expect, it } from "vitest";

import {
  GRANULARITY_BY_RANGE,
  RANGE_KEYS,
  RANGE_LABELS,
} from "./range";

describe("overview ranges", () => {
  it("exposes day, month, year in order", () => {
    expect(RANGE_KEYS).toEqual(["day", "month", "year"]);
    expect(RANGE_LABELS).toEqual({ day: "Day", month: "Month", year: "Year" });
  });

  it("maps each range to a single bucket size", () => {
    expect(GRANULARITY_BY_RANGE).toEqual({
      day: "day",
      month: "month",
      year: "year",
    });
  });

});

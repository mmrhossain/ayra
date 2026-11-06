export const RANGE_KEYS = ["day", "month", "year"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];
export type Granularity = "day" | "week" | "month" | "year";

export const RANGE_LABELS: Record<RangeKey, string> = {
  day: "Day",
  month: "Month",
  year: "Year",
};

export const GRANULARITY_BY_RANGE: Record<RangeKey, Granularity> = {
  day: "day",
  month: "month",
  year: "year",
};


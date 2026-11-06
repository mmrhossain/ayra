export const NUM = new Intl.NumberFormat("en-BD");

export const moneyFormatter = (currency: string) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

export type MetricFormat = "money" | "count" | "percent";

export function formatMetric(
  value: number,
  format: MetricFormat,
  currency: string,
): string {
  if (format === "money") return moneyFormatter(currency).format(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  return NUM.format(value);
}

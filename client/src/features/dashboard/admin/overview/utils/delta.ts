export function percentChange(
  current: number,
  previous: number | null,
): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatDelta(value: number | null): string {
  if (value === null) return "No prior data";
  if (value === 0) return "0.0%";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

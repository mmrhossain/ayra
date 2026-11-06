import { env } from "../../../../config/env.ts";

/**
 * Decides whether a stock change deserves an admin alert. Alerts are edge
 * triggered: crossing below the threshold (or selling out) notifies once,
 * while further changes within the same low-stock band stay silent.
 */
export const isLowStockTrigger = (
  previousAvailable: number,
  nextAvailable: number,
  threshold: number = env.LOW_STOCK_THRESHOLD
): boolean => {
  if (previousAvailable > 0 && nextAvailable <= 0) return true;
  if (threshold <= 0) return false;
  return previousAvailable >= threshold && nextAvailable < threshold;
};

import { DashboardApiError } from "@/lib/api/dashboard";

export const REASONS = ["RESTOCK", "DAMAGE", "CORRECTION", "RETURN"] as const;

export function differenceFor(
  type: "increase" | "decrease" | "set",
  quantity: number,
  onHand: number,
): number {
  if (type === "increase") return quantity;
  if (type === "decrease") return -quantity;
  return quantity - onHand;
}

export function toInventoryErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

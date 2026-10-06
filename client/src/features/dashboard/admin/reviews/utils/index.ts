import { DashboardApiError } from "@/lib/api/dashboard";
import type { AdminReviewItem } from "../types";

export function isReviewRejected(item: AdminReviewItem): boolean {
  return !item.isApproved && Boolean(item.rejectionReason);
}

export function reviewStatusLabel(
  item: AdminReviewItem,
): "Approved" | "Rejected" | "Pending" {
  if (item.isApproved) return "Approved";
  if (isReviewRejected(item)) return "Rejected";
  return "Pending";
}

export function toReviewErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function reviewCustomerLabel(item: AdminReviewItem): string {
  const user = item.customerProfile?.user;
  return user?.name?.trim() || user?.email?.trim() || "—";
}

export function commentSnippet(comment?: string | null, max = 80): string {
  const text = comment?.trim();
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

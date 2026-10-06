import { DashboardApiError } from "@/lib/api/dashboard";
import type { PaymentRecord } from "@/features/dashboard/admin/payments/types";

export function toPaymentErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function isCodCollectable(
  payment: Pick<PaymentRecord, "method" | "status">,
): boolean {
  return payment.method === "COD" && payment.status === "PENDING";
}

export function isRefundable(payment: Pick<PaymentRecord, "status">): boolean {
  return !["PENDING", "INITIATED", "FAILED", "CANCELLED"].includes(
    payment.status,
  );
}

export function paymentCustomerLabel(payment: PaymentRecord): string {
  const user = payment.order?.customerProfile?.user;
  return (
    user?.name?.trim() ||
    user?.email?.trim() ||
    payment.order?.customerProfile?.customerCode ||
    "—"
  );
}

import { AppError } from "../../../common/errors/AppError.ts";
import type { RefundStatus } from "../../../generated/prisma/enums.ts";

export const REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["PROCESSING", "COMPLETED", "REJECTED"],
  PROCESSING: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
};

export const canTransitionRefund = (
  from: RefundStatus,
  to: RefundStatus,
): boolean => REFUND_TRANSITIONS[from].includes(to);

export const assertRefundTransition = (
  from: RefundStatus,
  to: RefundStatus,
): void => {
  if (!canTransitionRefund(from, to)) {
    throw new AppError(`Refund cannot move from ${from} to ${to}`, 409);
  }
};

export const isRefundablePaymentStatus = (status: string): boolean =>
  status !== "PENDING" &&
  status !== "INITIATED" &&
  status !== "FAILED" &&
  status !== "CANCELLED";

export const exceedsRefundableAmount = (
  paymentAmount: number,
  alreadyRefunded: number,
  requested: number,
): boolean => alreadyRefunded + requested > paymentAmount;

export const resolvePaymentRefundStatus = (
  paymentAmount: number,
  completedTotal: number,
): "REFUNDED" | "PARTIALLY_REFUNDED" | null => {
  if (completedTotal <= 0) return null;
  return completedTotal >= paymentAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";
};

import { describe, expect, it } from "vitest";
import { AppError } from "../../src/common/errors/AppError.ts";
import {
  REFUND_TRANSITIONS,
  assertRefundTransition,
  canTransitionRefund,
  exceedsRefundableAmount,
  isRefundablePaymentStatus,
  resolvePaymentRefundStatus,
} from "../../src/modules/payment/utils/refund-state.ts";

describe("refund state", () => {
  it("allows the documented transitions and rejects the rest", () => {
    expect(canTransitionRefund("PENDING", "APPROVED")).toBe(true);
    expect(canTransitionRefund("PENDING", "REJECTED")).toBe(true);
    expect(canTransitionRefund("APPROVED", "PROCESSING")).toBe(true);
    expect(canTransitionRefund("APPROVED", "COMPLETED")).toBe(true);
    expect(canTransitionRefund("APPROVED", "REJECTED")).toBe(true);
    expect(canTransitionRefund("PROCESSING", "COMPLETED")).toBe(true);

    expect(canTransitionRefund("COMPLETED", "PROCESSING")).toBe(false);
    expect(canTransitionRefund("REJECTED", "APPROVED")).toBe(false);
    expect(canTransitionRefund("PENDING", "COMPLETED")).toBe(false);
  });

  it("throws a 409 for invalid transitions", () => {
    expect(() => assertRefundTransition("COMPLETED", "APPROVED")).toThrowError(
      /cannot move from COMPLETED to APPROVED/,
    );
    try {
      assertRefundTransition("COMPLETED", "APPROVED");
      expect.unreachable("expected transition to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(409);
    }
    expect(() => assertRefundTransition("PENDING", "APPROVED")).not.toThrow();
  });

  it("keeps terminal states terminal", () => {
    expect(REFUND_TRANSITIONS.COMPLETED).toEqual([]);
    expect(REFUND_TRANSITIONS.REJECTED).toEqual([]);
  });

  it("only refunds settled payments", () => {
    expect(isRefundablePaymentStatus("PAID")).toBe(true);
    expect(isRefundablePaymentStatus("REFUNDED")).toBe(true);
    expect(isRefundablePaymentStatus("PARTIALLY_PAID")).toBe(true);
    expect(isRefundablePaymentStatus("PENDING")).toBe(false);
    expect(isRefundablePaymentStatus("INITIATED")).toBe(false);
    expect(isRefundablePaymentStatus("FAILED")).toBe(false);
    expect(isRefundablePaymentStatus("CANCELLED")).toBe(false);
  });

  it("caps refunds against the payment amount", () => {
    expect(exceedsRefundableAmount(100, 0, 100)).toBe(false);
    expect(exceedsRefundableAmount(100, 99, 1)).toBe(false);
    expect(exceedsRefundableAmount(100, 99, 2)).toBe(true);
    expect(exceedsRefundableAmount(100, 50, 51)).toBe(true);
  });

  it("maps completed totals to the payment refund status", () => {
    expect(resolvePaymentRefundStatus(100, 0)).toBeNull();
    expect(resolvePaymentRefundStatus(100, 40)).toBe("PARTIALLY_REFUNDED");
    expect(resolvePaymentRefundStatus(100, 100)).toBe("REFUNDED");
    expect(resolvePaymentRefundStatus(100, 120)).toBe("REFUNDED");
  });
});

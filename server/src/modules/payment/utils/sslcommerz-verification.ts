import { AppError } from "../../../common/errors/AppError.ts";
import type { GatewayVerification } from "../types.ts";

export const assertSslcommerzVerificationMatches = (
  tranId: string,
  payment: { amount: number; currency: string },
  verification: GatewayVerification,
) => {
  const verifiedReference =
    verification.transactionId || verification.providerReference;
  if (!verifiedReference || verifiedReference !== tranId) {
    throw new AppError(
      "Verified gateway transaction reference does not match the payment",
      400,
    );
  }

  if (verification.amount === undefined) {
    throw new AppError("Transaction amount is missing from the gateway", 400);
  }

  if (
    !Number.isFinite(verification.amount) ||
    Math.round(verification.amount * 100) !== Math.round(payment.amount * 100)
  ) {
    throw new AppError(
      `Transaction amount ${verification.amount} does not match payment amount ${payment.amount}`,
      400,
    );
  }

  if (
    !verification.currency ||
    verification.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    throw new AppError(
      `Transaction currency ${verification.currency ?? "unknown"} does not match payment currency ${payment.currency}`,
      400,
    );
  }
};

export const assertSslcommerzSettlementMatches = (
  stored: { valId: string | null; bankTranId: string | null },
  incoming: { valId: string; bankTranId: string | null },
) => {
  if (
    stored.valId !== incoming.valId ||
    (stored.bankTranId !== null &&
      incoming.bankTranId !== null &&
      stored.bankTranId !== incoming.bankTranId)
  ) {
    throw new AppError(
      "Gateway settlement details conflict with the recorded payment",
      409,
      "PAYMENT_REFERENCE_CONFLICT",
    );
  }
};

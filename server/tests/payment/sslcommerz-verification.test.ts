import { describe, expect, it } from "vitest";
import {
  assertSslcommerzSettlementMatches,
  assertSslcommerzVerificationMatches,
} from "../../src/modules/payment/utils/sslcommerz-verification.ts";
import type { GatewayVerification } from "../../src/modules/payment/types.ts";

const verification = (
  overrides: Partial<GatewayVerification> = {},
): GatewayVerification => ({
  valid: true,
  providerReference: "tran-1",
  transactionId: "tran-1",
  amount: 100,
  currency: "BDT",
  raw: {},
  ...overrides,
});

describe("SSLCommerz verification matching", () => {
  it("accepts a matching reference, amount, and currency", () => {
    expect(() =>
      assertSslcommerzVerificationMatches(
        "tran-1",
        { amount: 100, currency: "BDT" },
        verification({ currency: "bdt" }),
      ),
    ).not.toThrow();
  });

  it("rejects a validated transaction with a different reference", () => {
    expect(() =>
      assertSslcommerzVerificationMatches(
        "tran-1",
        { amount: 100, currency: "BDT" },
        verification({ transactionId: "tran-2" }),
      ),
    ).toThrow("reference does not match");
  });

  it("rejects even a one-minor-unit amount mismatch", () => {
    expect(() =>
      assertSslcommerzVerificationMatches(
        "tran-1",
        { amount: 100, currency: "BDT" },
        verification({ amount: 100.01 }),
      ),
    ).toThrow("does not match payment amount");
  });

  it("rejects a currency mismatch", () => {
    expect(() =>
      assertSslcommerzVerificationMatches(
        "tran-1",
        { amount: 100, currency: "BDT" },
        verification({ currency: "USD" }),
      ),
    ).toThrow("does not match payment currency");
  });

  it("rejects missing verification amounts", () => {
    expect(() =>
      assertSslcommerzVerificationMatches(
        "tran-1",
        { amount: 100, currency: "BDT" },
        verification({ amount: undefined }),
      ),
    ).toThrow("amount is missing");
  });
});

describe("SSLCommerz settlement replay matching", () => {
  it("accepts an identical settlement replay", () => {
    expect(() =>
      assertSslcommerzSettlementMatches(
        { valId: "val-1", bankTranId: "bank-1" },
        { valId: "val-1", bankTranId: "bank-1" },
      ),
    ).not.toThrow();
  });

  it("rejects a different validation or bank transaction ID", () => {
    expect(() =>
      assertSslcommerzSettlementMatches(
        { valId: "val-1", bankTranId: "bank-1" },
        { valId: "val-2", bankTranId: "bank-1" },
      ),
    ).toThrow("conflict with the recorded payment");

    expect(() =>
      assertSslcommerzSettlementMatches(
        { valId: "val-1", bankTranId: "bank-1" },
        { valId: "val-1", bankTranId: "bank-2" },
      ),
    ).toThrow("conflict with the recorded payment");
  });
});

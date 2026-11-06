import { describe, expect, it } from "vitest";

import { listRefundsQuerySchema } from "../../src/modules/payment/validators/payment.validators.ts";

describe("listRefundsQuerySchema", () => {
  it("applies pagination defaults", () => {
    const parsed = listRefundsQuerySchema.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it("parses refund filters", () => {
    const parsed = listRefundsQuerySchema.parse({
      page: "2",
      limit: "10",
      status: "PROCESSING",
      method: "SSLCOMMERZ",
      requiresManualProcessing: "true",
    });

    expect(parsed).toMatchObject({
      page: 2,
      limit: 10,
      status: "PROCESSING",
      method: "SSLCOMMERZ",
      requiresManualProcessing: true,
    });
  });

  it("parses the false manual-processing filter", () => {
    const parsed = listRefundsQuerySchema.parse({
      requiresManualProcessing: "false",
    });

    expect(parsed.requiresManualProcessing).toBe(false);
  });

  it("trims and limits the search term", () => {
    expect(
      listRefundsQuerySchema.parse({ search: "  ORD-1001  " }).search,
    ).toBe("ORD-1001");
    expect(() => listRefundsQuerySchema.parse({ search: "   " })).toThrow();
  });

  it("rejects unknown refund statuses", () => {
    expect(() =>
      listRefundsQuerySchema.parse({ status: "DONE" }),
    ).toThrow();
  });
});

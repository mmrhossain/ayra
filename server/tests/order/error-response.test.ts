import { describe, expect, it } from "vitest";
import { mapPrismaError } from "../../src/common/utils/error-response.ts";

describe("mapPrismaError", () => {
  it("maps transaction timeouts to a retryable 503", () => {
    expect(mapPrismaError("P2028")).toEqual({
      statusCode: 503,
      message:
        "The operation timed out. Please retry; your order may not have been placed.",
    });
  });

  it("maps pool timeouts to a retryable 503", () => {
    expect(mapPrismaError("P2024")).toEqual({
      statusCode: 503,
      message: "The database is busy. Please retry in a moment.",
    });
  });

  it("leaves unrelated Prisma codes unmapped", () => {
    expect(mapPrismaError("P2002")).toBeNull();
  });
});

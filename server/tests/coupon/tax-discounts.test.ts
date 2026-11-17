import { describe, expect, it, vi } from "vitest";
import type { TransactionClient } from "../../src/lib/prisma.ts";
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: {} }));
import { applyCouponAtomic, calculateCouponPricingForRecord } from "../../src/modules/coupon/coupon.service.ts";
const coupon = {
  id: "coupon", code: "PRODUCT20", isActive: true, status: "ACTIVE",
  startsAt: new Date("2020-01-01"), expiresAt: new Date("2099-01-01"),
  minimumOrderAmount: null, usageLimit: null, usageCount: 0, usageLimitPerCustomer: null,
  discountType: "PERCENTAGE", discountValue: 20, maximumDiscountAmount: null,
};
const context = {
  subtotal: 200, productIds: ["eligible", "other"], productCategoryIds: ["category"],
  lines: [
    { productId: "eligible", categoryId: "category", subtotal: 100 },
    { productId: "other", categoryId: "category", subtotal: 100 },
  ],
};
describe("coupon tax allocation eligibility", () => {
  it("returns line eligibility from the existing atomic restriction lookup", async () => {
    const query = vi.fn().mockResolvedValueOnce([coupon]).mockResolvedValueOnce([{ kind: "product", id: "eligible" }]);
    const result = await applyCouponAtomic(coupon.code, "customer", context, { $queryRaw: query } as unknown as TransactionClient);
    expect(result).toMatchObject({ discountAmount: 20, discountEligible: [true, false] });
    expect(query).toHaveBeenCalledTimes(2);
  });
  it("returns the same eligibility for cart previews with a single restriction query", async () => {
    const query = vi.fn().mockResolvedValue([{ kind: "product", id: "eligible" }]);
    const result = await calculateCouponPricingForRecord({ $queryRaw: query }, coupon, context);
    expect(result).toEqual({ discountAmount: 20, discountEligible: [true, false] });
    expect(query).toHaveBeenCalledTimes(1);
  });
});

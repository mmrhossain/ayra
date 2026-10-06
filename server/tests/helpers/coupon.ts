import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma.ts";
import type { CleanupTracker } from "./tracker.ts";

export const createTestCoupon = async (
  tracker: CleanupTracker,
  opts?: {
    usageLimit?: number | null;
    isActive?: boolean;
    status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED";
    startsAt?: Date;
    expiresAt?: Date;
    discountValue?: number;
    usageLimitPerCustomer?: number | null;
    productIds?: string[];
    categoryIds?: string[];
    discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  }
) => {
  const code = `T${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const now = Date.now();
  const productIds = opts?.productIds ?? [];
  const categoryIds = opts?.categoryIds ?? [];
  const coupon = await prisma.coupon.create({
    data: {
      code,
      name: `Test coupon ${code}`,
      status: opts?.status ?? "ACTIVE",
      discountType: opts?.discountType ?? "FIXED_AMOUNT",
      discountValue:
        opts?.discountType === "FREE_SHIPPING" ? 0 : (opts?.discountValue ?? 10),
      usageLimit: opts?.usageLimit === undefined ? null : opts.usageLimit,
      usageLimitPerCustomer:
        opts?.usageLimitPerCustomer === undefined
          ? null
          : opts.usageLimitPerCustomer,
      startsAt: opts?.startsAt ?? new Date(now - 60_000),
      expiresAt: opts?.expiresAt ?? new Date(now + 24 * 60 * 60 * 1000),
      isActive: opts?.isActive ?? true,
      applicableProductIds: productIds,
      applicableCategoryIds: categoryIds,
      ...(productIds.length > 0 && {
        products: {
          create: productIds.map((productId) => ({ productId })),
        },
      }),
      ...(categoryIds.length > 0 && {
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      }),
    },
  });
  tracker.couponIds.push(coupon.id);
  return coupon;
};

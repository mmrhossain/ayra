import type { Prisma } from "../../generated/prisma/client.ts";
import type { z } from "zod";
import type {
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupon.validator.ts";

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type ListCouponsQuery = z.infer<typeof listCouponsQuerySchema>;

export type CouponLine = {
  productId: string;
  categoryId: string;
  subtotal: number;
};

export type CouponContext = {
  subtotal: number;
  productIds: string[];
  productCategoryIds: string[];
  lines?: CouponLine[];
};

export type CouponSnapshot = {
  id: string;
  code: string;
  isActive: boolean;
  status: string;
  startsAt: Date;
  expiresAt: Date;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  usageLimitPerCustomer: number | null;
  discountType: string;
  discountValue: number;
  maximumDiscountAmount: number | null;
};

export type CouponRecord = {
  id: string;
  code: string;
  isActive: boolean;
  status: string;
  startsAt: Date;
  expiresAt: Date;
  minimumOrderAmount: Prisma.Decimal | number | string | null;
  usageLimit: number | null;
  usageCount: number;
  usageLimitPerCustomer: number | null;
  discountType: string;
  discountValue: Prisma.Decimal | number | string;
  maximumDiscountAmount: Prisma.Decimal | number | string | null;
  deletedAt?: Date | null;
};

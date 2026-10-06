import { z } from "zod";

import {
  COUPON_STATUSES,
  DISCOUNT_TYPES,
} from "@/features/dashboard/admin/coupons/types";

export const optionalAmount = z.preprocess(
  (v) =>
    v === "" || v === undefined || v === null || Number.isNaN(v) ? null : v,
  z.number().nonnegative().nullable(),
);

export const discountValueSchema = z.preprocess(
  (v) =>
    v === "" || v === undefined || v === null || Number.isNaN(v)
      ? undefined
      : v,
  z.number().nonnegative("Must be 0 or greater").optional(),
);

export const optionalPositiveInt = z.preprocess(
  (v) =>
    v === "" || v === undefined || v === null || Number.isNaN(v)
      ? undefined
      : v,
  z.number().int().positive().optional(),
);

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code is required")
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, _ and - only"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    status: z.enum(COUPON_STATUSES),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: discountValueSchema,
    minimumOrderAmount: optionalAmount,
    maximumDiscountAmount: optionalAmount,
    usageLimit: optionalPositiveInt,
    usageLimitPerCustomer: optionalPositiveInt,
    startsAt: z.string().min(1, "Start date is required"),
    expiresAt: z.string().min(1, "Expiry date is required"),
    isActive: z.boolean(),
    applicableProductIds: z.array(z.string()),
    applicableCategoryIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.expiresAt) {
      if (new Date(data.expiresAt) <= new Date(data.startsAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiry date must be after start date",
          path: ["expiresAt"],
        });
      }
    }
    if (data.discountType === "PERCENTAGE") {
      if (data.discountValue === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount value is required",
          path: ["discountValue"],
        });
      } else if (data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage cannot exceed 100",
          path: ["discountValue"],
        });
      }
    } else if (data.discountType === "FIXED_AMOUNT") {
      if (data.discountValue === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount value is required",
          path: ["discountValue"],
        });
      }
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;

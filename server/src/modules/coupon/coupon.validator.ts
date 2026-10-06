import { z } from "zod";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";

const idList = z.array(z.string().min(1));

const couponFields = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((value) => value.trim().toUpperCase()),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "DISABLED"]).default("ACTIVE"),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  discountValue: z.coerce.number().nonnegative(),
  minimumOrderAmount: z.coerce.number().nonnegative().nullable().optional(),
  maximumDiscountAmount: z.coerce.number().nonnegative().nullable().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  usageLimitPerCustomer: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  isActive: z.boolean().default(true),
  applicableProductIds: idList,
  applicableCategoryIds: idList,
});

const refineDiscountValue = (
  data: { discountType?: string | undefined; discountValue?: number | undefined },
  ctx: z.RefinementCtx,
) => {
  if (
    data.discountType === "PERCENTAGE" &&
    data.discountValue !== undefined &&
    data.discountValue > 100
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountValue"],
      message: "Percentage cannot exceed 100",
    });
  }
};

export const createCouponSchema = couponFields
  .extend({
    applicableProductIds: idList.default([]),
    applicableCategoryIds: idList.default([]),
  })
  .superRefine((data, ctx) => {
    refineDiscountValue(data, ctx);
    if (data.expiresAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "expiresAt must be after startsAt",
      });
    }
  });

export const updateCouponSchema = couponFields.partial().superRefine((data, ctx) => {
  refineDiscountValue(data, ctx);
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
});

export const listCouponsQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

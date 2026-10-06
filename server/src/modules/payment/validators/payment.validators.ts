import { z } from "zod";
import {
  dateRangeQuerySchema,
  paginationQuerySchema,
} from "../../../common/validators/pagination.ts";

export const paymentMethodSchema = z.enum(["COD", "SSLCOMMERZ"]);

export const initiatePaymentSchema = z.object({
  method: paymentMethodSchema,
});

export const refundSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  reason: z.string().max(500).optional(),
});

export const paymentStatusSchema = z.enum([
  "PENDING",
  "INITIATED",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "COLLECTED",
]);

export const listPaymentsQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    status: paymentStatusSchema.optional(),
    method: paymentMethodSchema.optional(),
  });

export const sslcommerzSuccessSchema = z
  .object({
    val_id: z.string().min(1),
    tran_id: z.string().min(1),
  })
  .passthrough();

export const sslcommerzFailCancelSchema = z
  .object({
    tran_id: z.string().min(1),
  })
  .passthrough();

export const sslcommerzIpnSchema = z
  .object({
    status: z.string().min(1),
    tran_id: z.string().min(1),
    val_id: z.string().optional(),
    verify_sign: z.string().min(1),
    verify_key: z.string().min(1),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const success = value.status === "VALID" || value.status === "VALIDATED";
    if (success && !value.val_id) {
      ctx.addIssue({
        code: "custom",
        path: ["val_id"],
        message: "val_id is required for successful transactions",
      });
    }
  });

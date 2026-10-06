import { z } from "zod";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";

export const restockOrRefundSchema = z.enum(["RESTOCK", "REFUND"]);

export const returnRequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const createReturnRequestSchema = z.object({
  reason: z.string().min(1).max(1000).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        restockOrRefund: restockOrRefundSchema,
      })
    )
    .min(1),
});

export const listReturnRequestsQuerySchema = paginationQuerySchema.extend({
  status: returnRequestStatusSchema.optional(),
  orderId: z.string().min(1).optional(),
});

export const reviewReturnRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().max(1000).optional(),
});

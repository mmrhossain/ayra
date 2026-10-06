import { z } from "zod";
import {
  dateRangeQuerySchema,
  paginationQuerySchema,
} from "../../../common/validators/pagination.ts";

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
]);

export const listOrdersQuerySchema = paginationQuerySchema
  .merge(dateRangeQuerySchema)
  .extend({
    status: orderStatusSchema.optional(),
    search: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
  });

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  remarks: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});

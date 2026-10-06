import { z } from "zod";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  orderId: z.string().min(1).optional(),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().max(2000).optional(),
  })
  .refine((d) => d.rating !== undefined || d.comment !== undefined, {
    message: "Provide at least one field to update",
  });

export const listReviewsQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminListReviewsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const rejectReviewSchema = z.object({
  rejectionReason: z.string().max(500).optional(),
});

import type { z } from "zod";
import type {
  adminListReviewsQuerySchema,
  createReviewSchema,
  listReviewsQuerySchema,
  rejectReviewSchema,
  updateReviewSchema,
} from "./validators/review.validators.ts";

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type AdminListReviewsQuery = z.infer<typeof adminListReviewsQuerySchema>;
export type RejectReviewInput = z.infer<typeof rejectReviewSchema>;

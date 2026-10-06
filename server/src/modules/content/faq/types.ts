import type { z } from "zod";
import type {
  createFaqCategorySchema,
  createFaqItemSchema,
  listFaqItemsQuerySchema,
  updateFaqCategorySchema,
  updateFaqItemSchema,
} from "./validators/faq.validators.ts";

export type CreateFaqCategoryInput = z.infer<typeof createFaqCategorySchema>;
export type UpdateFaqCategoryInput = z.infer<typeof updateFaqCategorySchema>;
export type CreateFaqItemInput = z.infer<typeof createFaqItemSchema>;
export type UpdateFaqItemInput = z.infer<typeof updateFaqItemSchema>;
export type ListFaqItemsQuery = z.infer<typeof listFaqItemsQuerySchema>;

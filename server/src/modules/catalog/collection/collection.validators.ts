import { z } from "zod";
import { slugSchema } from "../../../common/validators/slug.ts";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";
export const collectionFields = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.refine(value => !["default-new-arrivals", "default-featured", "default-discount"].includes(value), "This collection URL is reserved"),
  description: z.string().trim().max(2000).nullable(),
  source: z.enum(["MANUAL", "NEW_ARRIVALS", "BEST_SELLERS", "DISCOUNT", "TRENDING", "FEATURED"]),
  placement: z.enum(["HOME", "LANDING", "NONE"]),
  sortOrder: z.number().int().min(0).max(100000),
  limit: z.number().int().min(1).max(48),
  startsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  isActive: z.boolean(),
  productIds: z.array(z.string().min(1)).max(1000).refine(ids => new Set(ids).size === ids.length, "Duplicate products are not allowed")
});
export const createCollectionSchema = collectionFields.extend({
  description: collectionFields.shape.description.default(null),
  source: collectionFields.shape.source.default("MANUAL"),
  placement: collectionFields.shape.placement.default("HOME"),
  sortOrder: collectionFields.shape.sortOrder.default(0),
  limit: collectionFields.shape.limit.default(8),
  startsAt: collectionFields.shape.startsAt.default(null),
  endsAt: collectionFields.shape.endsAt.default(null),
  isActive: collectionFields.shape.isActive.default(true),
  productIds: collectionFields.shape.productIds.default([])
});
export const updateCollectionSchema = collectionFields.partial();
export const listCollectionsSchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional()
});
export const collectionCursorSchema = z.object({
  cursor: z.string().max(2000).optional()
});
export type CreateCollection = z.infer<typeof createCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;

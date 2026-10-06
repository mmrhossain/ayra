import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";
import {
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../../../media/media.validators.ts";

export const listAdminCategoriesQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  image: optionalCloudinaryImageUrlSchema,
  imagePublicId: optionalMediaPublicIdSchema,
  isActive: z.boolean().default(true),
  parentId: z.string().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

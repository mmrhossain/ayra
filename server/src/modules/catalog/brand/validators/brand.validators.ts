import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";
import { slugSchema } from "../../../../common/validators/slug.ts";
import {
  nullableCloudinaryImageUrlSchema,
  nullableMediaPublicIdSchema,
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../../../media/media.validators.ts";

export { slugSchema };

export const listAdminBrandsQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const createBrandSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema.optional(),
  logo: optionalCloudinaryImageUrlSchema,
  logoPublicId: optionalMediaPublicIdSchema,
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  logo: nullableCloudinaryImageUrlSchema,
  logoPublicId: nullableMediaPublicIdSchema,
});

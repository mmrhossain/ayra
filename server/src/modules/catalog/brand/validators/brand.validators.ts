import { z } from "zod";
import { slugSchema } from "../../../../common/validators/slug.ts";
import {
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../../../media/media.validators.ts";

export { slugSchema };

export const createBrandSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema.optional(),
  logo: optionalCloudinaryImageUrlSchema,
  logoPublicId: optionalMediaPublicIdSchema,
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();

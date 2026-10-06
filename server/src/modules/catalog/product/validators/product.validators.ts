import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";
import { slugSchema } from "../../../../common/validators/slug.ts";
import {
  cloudinaryImageUrlSchema,
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../../../media/media.validators.ts";

export { slugSchema };

export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

const productImageSchema = z
  .object({
    url: optionalCloudinaryImageUrlSchema,
    imageUrl: optionalCloudinaryImageUrlSchema,
    publicId: optionalMediaPublicIdSchema,
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((image) => Boolean(image.url || image.imageUrl), {
    message: "url or imageUrl is required",
  });

const requireOnePrimaryImage = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, ctx) => {
    const images = (value as { images?: Array<{ isPrimary: boolean }> }).images;
    if (!images?.length) return;
    const primaryCount = images.filter((image) => image.isPrimary).length;
    if (primaryCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["images"],
        message: "Exactly one image must be marked isPrimary",
      });
    }
  });

const productFields = z.object({
  name: z.string().min(1),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().min(1),
  brandId: z.string().nullable().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  images: z.array(productImageSchema).max(5).optional(),
});

export const variantImageSchema = z.object({
  imageUrl: cloudinaryImageUrlSchema,
  publicId: optionalMediaPublicIdSchema,
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export const variantDefaultsSchema = z.object({
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  weight: z.coerce.number().nonnegative().optional(),
});

export const variantOptionGroupSchema = z.object({
  attributeId: z.string().min(1),
  attributeValueIds: z.array(z.string().min(1)).min(1),
});

export const variantOverrideSchema = z.object({
  attributeValueIds: z.array(z.string().min(1)).min(1),
  sku: z.string().min(1).optional(),
  barcode: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  isDefault: z.boolean().optional(),
  images: z.array(variantImageSchema).optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  isDefault: z.boolean().default(false),
  attributeValueIds: z.array(z.string()).optional(),
  images: z.array(variantImageSchema).optional(),
});

export const nestedCreateVariantSchema = createVariantSchema.extend({
  sku: z.string().min(1).optional(),
});

export const updateVariantSchema = createVariantSchema.partial();

export const createProductSchema = requireOnePrimaryImage(
  productFields.extend({
    variants: z.array(nestedCreateVariantSchema).optional(),
    variantOptions: z.array(variantOptionGroupSchema).optional(),
    variantDefaults: variantDefaultsSchema.optional(),
    variantOverrides: z.array(variantOverrideSchema).optional(),
  }),
);

export const updateProductSchema = requireOnePrimaryImage(
  productFields.partial().extend({
    variants: z.array(updateVariantSchema.extend({ id: z.string().optional() })).optional(),
    variantOptions: z.array(variantOptionGroupSchema).optional(),
    variantDefaults: variantDefaultsSchema.optional(),
    variantOverrides: z.array(variantOverrideSchema).optional(),
  }),
);

export const listProductsQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  featured: z.coerce.boolean().optional(),
  onSale: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
  includeInactive: z.coerce.boolean().optional(),
  status: productStatusSchema.optional(),
});

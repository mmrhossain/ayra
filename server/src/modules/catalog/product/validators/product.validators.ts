import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";
import { slugSchema } from "../../../../common/validators/slug.ts";
import {
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
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().min(1),
  brandId: z.string().nullable().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  images: z.array(productImageSchema).max(5).optional(),
});

const moneySchema = z.coerce
  .number()
  .max(1_000_000)
  .multipleOf(0.01);
const priceSchema = moneySchema.positive();
const costPriceSchema = moneySchema.nonnegative();

export const variantDefaultsSchema = z.object({
  price: priceSchema,
  compareAtPrice: priceSchema.optional(),
  costPrice: costPriceSchema.optional(),
  weight: z.coerce.number().nonnegative().optional(),
});

export const variantOptionGroupSchema = z.object({
  attributeId: z.string().min(1),
  attributeValueIds: z.array(z.string().min(1)).min(1),
});

export const variantOverrideSchema = z.object({
  attributeValueIds: z.array(z.string().min(1)).min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: priceSchema.optional(),
  compareAtPrice: priceSchema.optional(),
  costPrice: costPriceSchema.optional(),
  weight: z.coerce.number().nonnegative().optional(),
  isDefault: z.boolean().optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: priceSchema,
  compareAtPrice: priceSchema.optional(),
  costPrice: costPriceSchema.optional(),
  weight: z.coerce.number().nonnegative().optional(),
  isDefault: z.boolean().default(false),
  attributeValueIds: z.array(z.string()).optional(),
});

export const nestedCreateVariantSchema = createVariantSchema;

// Explicit null clears a known buying cost. Omitted leaves it unchanged, so
// "unknown" and zero remain distinct values.
export const updateVariantSchema = createVariantSchema.partial().extend({
  // Check null before the coerce schema: z.coerce.number() turns null into 0.
  costPrice: z.union([z.null(), costPriceSchema]).optional(),
});


export const createProductSchema = requireOnePrimaryImage(
  productFields.extend({
    variants: z.array(nestedCreateVariantSchema).optional(),
    variantOptions: z.array(variantOptionGroupSchema).optional(),
    variantDefaults: variantDefaultsSchema.optional(),
    variantOverrides: z.array(variantOverrideSchema).optional(),
  }).superRefine((value, ctx) => {
    if (value.variants?.length && value.variantOptions?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Provide either variants or variantOptions, not both",
      });
      return;
    }
    if (value.variantOptions?.length && !value.variantDefaults) {
      ctx.addIssue({
        code: "custom",
        path: ["variantDefaults"],
        message: "variantDefaults is required when variantOptions are provided",
      });
    }
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

const queryStringParam = z.union([z.string(), z.array(z.string())]).optional();

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
  attrs: queryStringParam,
  categories: queryStringParam,
});

export const productFacetsQuerySchema = listProductsQuerySchema;

const bulkIds = z.array(z.string().min(1)).min(1).max(100);

export const bulkProductActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("set-status"),
    ids: bulkIds,
    status: productStatusSchema,
  }),
  z.object({
    type: z.literal("set-featured"),
    ids: bulkIds,
    isFeatured: z.boolean(),
  }),
  z.object({
    type: z.literal("set-category"),
    ids: bulkIds,
    categoryId: z.string().min(1),
  }),
  z.object({
    type: z.literal("delete"),
    ids: bulkIds,
  }),
]);

export type BulkProductActionInput = z.infer<typeof bulkProductActionSchema>;

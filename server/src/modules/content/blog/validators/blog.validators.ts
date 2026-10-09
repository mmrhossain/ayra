import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";
import { slugSchema as baseSlugSchema } from "../../../../common/validators/slug.ts";
import {
  nullableCloudinaryImageUrlSchema,
  nullableMediaPublicIdSchema,
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../../../media/media.validators.ts";

export const slugSchema = baseSlugSchema.max(200);
export const uuidSchema = z.string().uuid();
export const blogContentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createBlogCategorySchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
});

export const updateBlogCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: slugSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required",
  });

export const createBlogSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema,
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1).max(200000),
  featuredImage: optionalCloudinaryImageUrlSchema,
  featuredImagePublicId: optionalMediaPublicIdSchema,
  categoryId: uuidSchema.nullable().optional(),
  metaTitle: z.string().trim().max(200).optional(),
  metaDescription: z.string().trim().max(500).optional(),
  metaKeywords: z.string().trim().max(300).optional(),
});

export const updateBlogSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: slugSchema.optional(),
    excerpt: z.string().trim().max(500).nullable().optional(),
    content: z.string().trim().min(1).max(200000).optional(),
    featuredImage: nullableCloudinaryImageUrlSchema,
    featuredImagePublicId: nullableMediaPublicIdSchema,
    categoryId: uuidSchema.nullable().optional(),
    metaTitle: z.string().trim().max(200).nullable().optional(),
    metaDescription: z.string().trim().max(500).nullable().optional(),
    metaKeywords: z.string().trim().max(300).nullable().optional(),
    status: blogContentStatusSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required",
  });

export const listPublicBlogsQuerySchema = paginationQuerySchema.extend({
  category: slugSchema.optional(),
});

export const listAdminBlogsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  status: blogContentStatusSchema.optional(),
  categoryId: uuidSchema.optional(),
});

export const blogSlugParamSchema = z.object({
  slug: slugSchema,
});

export const blogIdParamSchema = z.object({
  id: uuidSchema,
});

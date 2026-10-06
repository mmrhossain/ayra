import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const blogCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: slugSchema,
});

export const blogFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: slugSchema,
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required").max(200000),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(300).optional(),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;
export type BlogFormValues = z.infer<typeof blogFormSchema>;

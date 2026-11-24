import { z } from "zod";
export const uuidSchema = z.string().uuid();

export const sortOrderSchema = z.number().int().min(0).max(1_000_000);

export const createFaqCategorySchema = z.object({
  name: z.string().trim().min(1).max(200),
  sortOrder: sortOrderSchema.default(0),
  isActive: z.boolean().default(true),
});

export const updateFaqCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    sortOrder: sortOrderSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required",
  });

export const createFaqItemSchema = z.object({
  categoryId: uuidSchema,
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(20000),
  sortOrder: sortOrderSchema.default(0),
  isPublished: z.boolean().default(false),
});

export const updateFaqItemSchema = z
  .object({
    categoryId: uuidSchema.optional(),
    question: z.string().trim().min(1).max(500).optional(),
    answer: z.string().trim().min(1).max(20000).optional(),
    sortOrder: sortOrderSchema.optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required",
  });

export const listFaqItemsQuerySchema = z.object({
  categoryId: uuidSchema.optional(),
});

export const faqIdParamSchema = z.object({
  id: uuidSchema,
});

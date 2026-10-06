import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const faqCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: slugSchema,
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const faqItemFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  question: z.string().min(1, "Question is required").max(500),
  answer: z.string().min(1, "Answer is required").max(20000),
  sortOrder: z.number().int().min(0),
  isPublished: z.boolean(),
});

export type FaqCategoryFormValues = z.infer<typeof faqCategoryFormSchema>;
export type FaqItemFormValues = z.infer<typeof faqItemFormSchema>;

import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

const optionalSortOrder = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number({ error: "Sort order is required" }).int().min(0));

export const faqCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: slugSchema,
  sortOrder: optionalSortOrder,
  isActive: z.boolean(),
});

export const faqItemFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  question: z.string().min(1, "Question is required").max(500),
  answer: z.string().min(1, "Answer is required").max(20000),
  sortOrder: optionalSortOrder,
  isPublished: z.boolean(),
});

export type FaqCategoryFormValues = z.infer<typeof faqCategoryFormSchema>;
export type FaqItemFormValues = z.infer<typeof faqItemFormSchema>;

import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const detailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string()).max(5),
  primaryImageUrl: z.string(),
  isFeatured: z.boolean(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  price: z.string(),
});

export const createDetailsSchema = detailsSchema.superRefine((values, ctx) => {
  const price = Number(values.price);
  if (!values.price.trim() || !Number.isFinite(price) || price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price must be greater than 0",
    });
  }
});

export type DetailsFormValues = z.infer<typeof detailsSchema>;

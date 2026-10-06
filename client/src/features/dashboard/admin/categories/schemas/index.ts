import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

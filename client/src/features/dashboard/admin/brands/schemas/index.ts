import { z } from "zod";

export const brandFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
  logo: z.string().optional(),
  logoPublicId: z.string().optional(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

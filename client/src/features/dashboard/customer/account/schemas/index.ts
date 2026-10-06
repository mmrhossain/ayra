import { z } from "zod";

export const accountFormSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(["", "MALE", "FEMALE", "OTHER"]),
  imageUrl: z.string().optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

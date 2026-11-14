import * as z from "zod";

export const contactFormSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(100),
  lastName: z.string().trim().min(2, "Last name is required").max(100),
  phone: z.string().trim().regex(/^\+?\d{10,14}$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(254, "Email is too long"),
  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(5000, "Message must be 5000 characters or fewer"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

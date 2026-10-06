import * as z from "zod";

export const contactFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().regex(/^\+?\d{10,14}$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

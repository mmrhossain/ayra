import * as z from "zod";

export const loginSchema = z.object({
    identifier: z
        .string()
        .min(5, "Email or phone is required")
        .refine((value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^(?:\+88)?01[3-9]\d{8}$/; // Bangladesh phone
            return emailRegex.test(value) || phoneRegex.test(value);
        }, {
            message: "Enter a valid email or phone number",
        }),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),

    remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

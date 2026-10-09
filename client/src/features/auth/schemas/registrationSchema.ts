import * as z from "zod";

export const registrationSchema = z
    .object({
        fullName: z.string().min(3, "Full name is required"),

        identifier: z
            .string()
            .min(5, "Email or phone is required")
            .refine((value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^(?:\+88)?01[3-9]\d{8}$/; // BD phone support
                return emailRegex.test(value) || phoneRegex.test(value);
            }, {
                message: "Enter a valid email or phone number",
            }),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),

        password_confirmation: z.string().min(6, "Please confirm your password"),
        callbackURL: z.string().optional(),

        remember: z
            .boolean()
            .refine((value) => value === true, {
                message: "You must agree to the terms & conditions",
            }),
    })
    .refine((data) => data.password === data.password_confirmation, {
        path: ["password_confirmation"],
        message: "Passwords do not match",
    });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

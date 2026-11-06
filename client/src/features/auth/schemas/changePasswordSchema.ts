import * as z from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(8, "Please confirm your new password"),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one",
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaults: ChangePasswordFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  revokeOtherSessions: false,
};

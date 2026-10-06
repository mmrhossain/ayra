import { getBaseEmailTemplate } from "./email.ts";

export const PASSWORD_RESET_CODE = "PASSWORD_RESET";

export const PASSWORD_RESET_SUBJECT = "Reset your password";

export const getPasswordResetEmailHtml = ({
  userName,
  resetUrl,
}: {
  userName?: string | null;
  resetUrl: string;
}): string =>
  getBaseEmailTemplate({
    title: "Reset Your Password",
    userName,
    message:
      "We received a request to reset your password. Click the button below to choose a new password. This link expires in 1 hour.",
    buttonText: "Reset Password",
    buttonUrl: resetUrl,
  });

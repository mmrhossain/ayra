import { authClient } from "@/lib/api/auth/auth-client";

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
};

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Thin wrapper around Better Auth's built-in `/change-password` endpoint.
 * Handles both the returned error object and thrown transport errors so the
 * UI can render one consistent message.
 */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  try {
    const { error } = await authClient.changePassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: input.revokeOtherSessions ?? false,
    });

    if (error) {
      return { ok: false, message: toChangePasswordError(error) };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Could not reach the server. Please try again.",
    };
  }
}

export function toChangePasswordError(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  if (/invalid password|incorrect/i.test(message)) {
    return "Your current password is incorrect.";
  }
  if (/same password/i.test(message)) {
    return "New password must be different from the current one.";
  }
  if (/too short|at least/i.test(message)) {
    return "Password must be at least 8 characters.";
  }

  return message || "Could not change your password. Please try again.";
}

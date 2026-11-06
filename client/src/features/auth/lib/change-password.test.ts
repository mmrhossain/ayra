import { describe, expect, it } from "vitest";
import { toChangePasswordError } from "@/features/auth/lib/change-password";
import { changePasswordSchema } from "@/features/auth/schemas/changePasswordSchema";

describe("change password", () => {
  it("maps invalid password", () => {
    expect(toChangePasswordError({ message: "Invalid password" })).toBe(
      "Your current password is incorrect.",
    );
  });
  it("rejects mismatched confirm", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "oldpassword1",
      newPassword: "newpassword1",
      confirmPassword: "different1",
      revokeOtherSessions: false,
    });
    expect(r.success).toBe(false);
  });
  it("rejects reuse of current password", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "samepassword1",
      newPassword: "samepassword1",
      confirmPassword: "samepassword1",
      revokeOtherSessions: true,
    });
    expect(r.success).toBe(false);
  });
  it("accepts a valid change", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "oldpassword1",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
      revokeOtherSessions: true,
    });
    expect(r.success).toBe(true);
  });
});

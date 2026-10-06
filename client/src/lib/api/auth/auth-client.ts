import { BETTER_AUTH_URL } from "@/config";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for the unified backend.s
 *
 * One session powers the whole app (storefront + ADMIN/VENDOR/CUSTOMER areas).
 * Backend auth is at /api/v1/auth and is cookie-only
 * (credentials: include). Sign-in: POST /api/v1/auth/sign-in/email.
 */
export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  plugins: [
    // The backend extends the Better Auth user model with a `role` field
    // (ADMIN/VENDOR/CUSTOMER) and an `isApproved` flag for vendors.
    // Declare them here so `user.role` / `user.isApproved` are typed. They are
    // assigned server-side (role defaults to CUSTOMER on signup), so they are
    // not part of the sign-up/sign-in input.
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false, input: false },
        isApproved: { type: "boolean", input: false },
        banned: { type: "boolean", required: false, input: false },
        banReason: { type: "string", required: false, input: false },
        banExpires: { type: "date", required: false, input: false },
      },
    }),
  ],
});

export { SESSION_COOKIE } from "@/config/index";

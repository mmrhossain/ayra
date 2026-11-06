import { BETTER_AUTH_BASE_PATH, BETTER_AUTH_URL } from "@/config";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for the unified backend.
 *
 * Browser traffic always goes through same-origin `/backend-proxy`
 * unless NEXT_PUBLIC_BETTER_AUTH_URL is an explicit remote origin.
 */
export const authClient = createAuthClient({
  ...(BETTER_AUTH_URL ? { baseURL: BETTER_AUTH_URL } : {}),
  basePath: BETTER_AUTH_BASE_PATH,
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false, input: false },
        adminPermissions: { type: "string[]", required: false, input: false },
        adminActions: { type: "string[]", required: false, input: false },
        isSuperAdmin: { type: "boolean", required: false, input: false },
        staffStatus: { type: "string", required: false, input: false },
        banned: { type: "boolean", required: false, input: false },
        banReason: { type: "string", required: false, input: false },
        banExpires: { type: "date", required: false, input: false },
      },
    }),
  ],
});

export { SESSION_COOKIE } from "@/config";

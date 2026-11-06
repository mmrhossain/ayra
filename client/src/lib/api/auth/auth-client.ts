import { BETTER_AUTH_BASE_PATH } from "@/config/public";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
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

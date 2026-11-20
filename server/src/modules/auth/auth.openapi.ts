import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { sessionAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  jsonContent,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  adminListUsersQuerySchema,
  banUserSchema,
} from "./auth.validator.ts";

const TAG = "Auth";
const authUser = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  emailVerified: z.boolean(),
}).passthrough();
const authStatus = z.object({ status: z.boolean() });

registry.registerPath({
  method: "get",
  path: "/api/v1/session/access",
  tags: [TAG],
  summary: "Get the current user's fresh access permissions",
  security: sessionAuth,
  responses: {
    200: successResponse("Session access fetched", z.object({
      role: z.string().nullable(),
      staffStatus: z.string(),
      banned: z.boolean().nullable(),
      isSuperAdmin: z.boolean(),
      adminPermissions: z.array(z.string()),
    })),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-up/email",
  tags: [TAG],
  summary: "Sign up with email and password (Better Auth)",
  security: [],
  request: { body: { ...jsonBody(z.object({
    email: z.string().email(),
    name: z.string(),
    password: z.string(),
    image: z.string().optional(),
    callbackURL: z.string().optional(),
    rememberMe: z.boolean().optional(),
  })), required: true } },
  responses: {
    200: { description: "Signed up", ...jsonContent(z.object({ token: z.string().nullable(), user: authUser })) },
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-in/email",
  tags: [TAG],
  summary: "Sign in with email and password (Better Auth)",
  security: [],
  request: { body: { ...jsonBody(z.object({
    email: z.string().email(),
    password: z.string(),
    callbackURL: z.string().optional(),
    rememberMe: z.boolean().optional(),
  })), required: true } },
  responses: {
    200: { description: "Signed in", ...jsonContent(z.object({
      redirect: z.boolean(), token: z.string(), url: z.string().optional(), user: authUser,
    })) },
    ...errorResponses(400, 401, 403, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-out",
  tags: [TAG],
  summary: "Sign out the current session (Better Auth)",
  security: sessionAuth,
  responses: {
    200: { description: "Signed out", ...jsonContent(z.object({ success: z.literal(true) })) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/get-session",
  tags: [TAG],
  summary: "Get the current Better Auth session",
  responses: {
    200: {
      description: "Better Auth session and user, or null when signed out",
      ...jsonContent(z.object({ session: z.object({ id: z.string() }).passthrough(), user: authUser }).nullable()),
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/request-password-reset",
  tags: [TAG],
  summary: "Request a password-reset email (Better Auth)",
  security: [],
  request: { body: { ...jsonBody(z.object({
    email: z.string().email(),
    redirectTo: z.string().optional(),
  })), required: true } },
  responses: {
    200: { description: "Password reset requested", ...jsonContent(authStatus.extend({ message: z.string() })) },
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/reset-password/{token}",
  tags: [TAG],
  summary: "Open a password-reset link",
  request: {
    params: z.object({ token: z.string() }),
    query: z.object({ callbackURL: z.string() }),
  },
  responses: { 302: { description: "Redirect to the reset page with a token or an error" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/change-password",
  tags: [TAG],
  summary: "Change the signed-in user's password",
  security: sessionAuth,
  request: { body: { ...jsonBody(z.object({
    currentPassword: z.string(),
    newPassword: z.string(),
    revokeOtherSessions: z.boolean().optional(),
  })), required: true } },
  responses: {
    200: { description: "Password changed", ...jsonContent(z.object({
      token: z.string().nullable(),
      user: authUser,
    })) },
    ...errorResponses(400, 401, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/reset-password",
  tags: [TAG],
  summary: "Reset password with a token (Better Auth)",
  security: [],
  request: { body: { ...jsonBody(z.object({
    newPassword: z.string(),
    token: z.string().optional(),
  })), required: true }, query: z.object({ token: z.string().optional() }) },
  responses: {
    200: { description: "Password reset", ...jsonContent(authStatus) },
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/send-verification-email",
  tags: [TAG],
  summary: "Send email verification (Better Auth)",
  security: [],
  request: { body: { ...jsonBody(z.object({
    email: z.string().email(),
    callbackURL: z.string().optional(),
  })), required: true } },
  responses: {
    200: { description: "Verification requested", ...jsonContent(authStatus) },
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/verify-email",
  tags: [TAG],
  summary: "Verify email with a token (Better Auth)",
  security: [],
  request: { query: z.object({ token: z.string(), callbackURL: z.string().optional() }) },
  responses: {
    200: { description: "Email verified", ...jsonContent(authStatus.passthrough()) },
    302: { description: "Redirect to the callback URL" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-in/social",
  tags: [TAG],
  summary: "Start social sign-in (Better Auth, Google when configured)",
  security: [],
  request: { body: { ...jsonBody(z.object({
    provider: z.literal("google"),
    callbackURL: z.string().optional(),
    errorCallbackURL: z.string().optional(),
    newUserCallbackURL: z.string().optional(),
    disableRedirect: z.boolean().optional(),
  })), required: true } },
  responses: {
    200: { description: "Social sign-in started", ...jsonContent(z.object({ url: z.string(), redirect: z.boolean() })) },
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/callback/google",
  tags: [TAG],
  summary: "Google OAuth callback (Better Auth)",
  security: [],
  responses: {
    302: { description: "Redirect to storefront after OAuth" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/delete-user",
  tags: [TAG],
  summary: "Delete the current user account (Better Auth)",
  security: sessionAuth,
  request: { body: jsonBody(z.object({
    callbackURL: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
  })) },
  responses: {
    200: { description: "User deleted or verification requested", ...jsonContent(z.object({ success: z.boolean(), message: z.string() })) },
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/users",
  tags: [TAG],
  summary: "List users (admin)",
  security: sessionAuth,
  request: { query: adminListUsersQuerySchema },
  responses: {
    200: successResponse("Users fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/users/{id}",
  tags: [TAG],
  summary: "Get user by id (admin)",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
  },
  responses: {
    200: successResponse("User fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/users/{id}/ban",
  tags: [TAG],
  summary: "Ban a user (admin)",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(banUserSchema),
  },
  responses: {
    200: successResponse("User banned"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/users/{id}/unban",
  tags: [TAG],
  summary: "Unban a user (admin)",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
  },
  responses: {
    200: successResponse("User unbanned"),
    ...errorResponses(400, 401, 403, 404),
  },
});

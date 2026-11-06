import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  adminListUsersQuerySchema,
  banUserSchema,
} from "./auth.validator.ts";

const TAG = "Auth";

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-up/email",
  tags: [TAG],
  summary: "Sign up with email and password (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Signed up"),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-in/email",
  tags: [TAG],
  summary: "Sign in with email and password (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Signed in"),
    ...errorResponses(400, 401, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-out",
  tags: [TAG],
  summary: "Sign out the current session (Better Auth)",
  responses: {
    200: successResponse("Signed out"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/get-session",
  tags: [TAG],
  summary: "Get the current Better Auth session",
  responses: {
    200: successResponse("Session fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/request-password-reset",
  tags: [TAG],
  summary: "Request a password-reset email (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Password reset requested"),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/forget-password",
  tags: [TAG],
  summary: "Request a password-reset email alias (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Password reset requested"),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/reset-password",
  tags: [TAG],
  summary: "Reset password with a token (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Password reset"),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/send-verification-email",
  tags: [TAG],
  summary: "Send email verification (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Verification email sent"),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/verify-email",
  tags: [TAG],
  summary: "Verify email with a token (Better Auth)",
  security: [],
  responses: {
    200: successResponse("Email verified"),
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/sign-in/social",
  tags: [TAG],
  summary: "Start social sign-in (Better Auth, Google when configured)",
  security: [],
  responses: {
    200: successResponse("Social sign-in started"),
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
  responses: {
    200: successResponse("User deleted"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/users",
  tags: [TAG],
  summary: "List users (admin)",
  security: bearerAuth,
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
  security: bearerAuth,
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
  security: bearerAuth,
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
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
  },
  responses: {
    200: successResponse("User unbanned"),
    ...errorResponses(400, 401, 403, 404),
  },
});

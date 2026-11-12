import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { adminAc, defaultAc } from "better-auth/plugins/admin/access";
import { logger } from "../common/looger/logger.ts";
import { extractCloudinaryPublicId } from "../common/utils/cloudinary-public-id.ts";
import { env } from "../config/env.ts";
import { attachMediaAssets, deleteImages } from "../modules/media/media.service.ts";
import { getBaseEmailTemplate } from "../template/email.ts";
import { getPasswordResetEmailHtml, PASSWORD_RESET_SUBJECT } from "../template/password-reset.ts";
import { countActiveSuperAdminsById } from "./owner-guard.ts";
import { prisma } from "./prisma.ts";
import { createBetterAuthSecondaryStorage, redis } from "./redis.ts";
import { resend } from "./resend.ts";

/**
 * Every Better Auth admin endpoint is exposed under `/api/v1/auth/admin/*`.
 *
 * The plugin only checks that the caller holds the `ADMIN` role (via `adminAc`),
 * so a catalog-only staff member could otherwise create users, assign roles,
 * ban accounts, impersonate, reset passwords or delete users. The application
 * exposes its own permission-checked `/api/v1/admin/*` routes instead, so the
 * plugin's HTTP surface is disabled outright. Internal `auth.api.*` calls are
 * unaffected by `disabledPaths` and remain guarded by the application's own
 * authorization middleware.
 */
const DISABLED_ADMIN_PATHS = [
  "/admin/set-role",
  "/admin/get-user",
  "/admin/create-user",
  "/admin/update-user",
  "/admin/list-users",
  "/admin/list-user-sessions",
  "/admin/unban-user",
  "/admin/ban-user",
  "/admin/impersonate-user",
  "/admin/stop-impersonating",
  "/admin/revoke-user-session",
  "/admin/revoke-user-sessions",
  "/admin/remove-user",
  "/admin/set-user-password",
  "/admin/has-permission",
];

const sendAuthEmail = async (input: {
  kind: "verification" | "reset";
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  const from = env.RESEND_FROM;

  if (!env.RESEND_API_KEY || !from) {
    logger.error({
      message: "Auth email send skipped: RESEND_API_KEY or RESEND_FROM is not configured",
      kind: input.kind,
    });
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      logger.error({
        message: "Auth email send failed",
        kind: input.kind,
        status: error.statusCode,
        name: error.name,
      });
      return;
    }

    logger.info({
      message: "Auth email sent",
      kind: input.kind,
      id: data?.id,
    });
  } catch (err) {
    logger.error({
      message: "Auth email send failed",
      kind: input.kind,
      name: err instanceof Error ? err.name : "UnknownError",
    });
  }
};

const betterAuthSecondaryStorage =
  redis && env.NODE_ENV !== "test" ? createBetterAuthSecondaryStorage(redis) : undefined;

export const auth = betterAuth({
  appName: env.BETTER_AUTH_APP_NAME,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(betterAuthSecondaryStorage ? { secondaryStorage: betterAuthSecondaryStorage } : {}),
  trustedOrigins: [
    ...new Set([
      env.FRONTEND_URL,
      ...(env.isProduction ? [] : ["http://localhost:3000"]),
      ...env.EXTRA_TRUSTED_ORIGINS,
    ]),
  ],
  disabledPaths: DISABLED_ADMIN_PATHS,

  session: {
    // Authorization reads fresh rows on every request, but keep DB session
    // rows as well so revocation and auditing never depend on Redis alone.
    storeSessionInDatabase: true,
  },

  // User configuration with additional fields and self-deletion enabled
  user: {
    additionalFields: {
      role: {
        type: ["admin", "customer"],
        required: false,
        defaultValue: "customer",
        input: false, // don't allow user to set role
      },
      adminPermissions: {
        type: "string[]",
        required: false,
        defaultValue: [],
        input: false, // only super admins can change permissions
      },
      adminActions: {
        type: "string[]",
        required: false,
        defaultValue: [],
        input: false, // only super admins can change action permissions
      },
      isSuperAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // never settable through public signup/profile updates
      },
      staffStatus: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
      imagePublicId: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
    deleteUser: {
      enabled: true, // Allows users to delete their own account
    },
  },

  rateLimit: {
    enabled: env.NODE_ENV !== "test",
    window: 60,
    max: 100,
    ...(betterAuthSecondaryStorage ? { storage: "secondary-storage" as const } : {}),
    customRules: {
      "/get-session": false,
      "/ok": false,
      "/sign-in/email": {
        window: 10,
        max: 3,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/request-password-reset": {
        window: 60,
        max: 3,
      },
      "/forget-password": {
        window: 60,
        max: 3,
      },
      "/reset-password": {
        window: 60,
        max: 5,
      },
      "/sign-in/social": {
        window: 10,
        max: 5,
      },
      "/send-verification-email": {
        window: 60,
        max: 3,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const htmlContent = getPasswordResetEmailHtml({
        userName: user.name,
        resetUrl: url,
      });

      void sendAuthEmail({
        kind: "reset",
        to: user.email,
        subject: PASSWORD_RESET_SUBJECT,
        html: htmlContent,
      });
    },
    onPasswordReset: async ({ user }) => {
      logger.info({
        message: "Password reset completed",
        userId: user.id,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const htmlContent = getBaseEmailTemplate({
        title: "Verify Your Email Address",
        userName: user.name,
        message:
          "Thanks for joining us! Please click the button below to verify your email address and activate your account.",
        buttonText: "Verify Email",
        buttonUrl: url,
      });

      await sendAuthEmail({
        kind: "verification",
        to: user.email,
        subject: "Verify your email address",
        html: htmlContent,
      });
    },
  },

  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        },
      }
    : {}),

  advanced: {
    cookiePrefix: "ayra",
    useSecureCookies: env.isProduction,
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: env.isProduction,
      path: "/",
    },
    database: {
      joins: true, // its help to retrive other realtional table data
      generateId: () => crypto.randomUUID(), // Automatically generates UUIDs for Better Auth records
    },
  },

  databaseHooks: {
    user: {
      update: {
        before: async (user) => {
          if (!user.id) return;

          const existing = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              role: true,
              adminPermissions: true,
              adminActions: true,
              isSuperAdmin: true,
              staffStatus: true,
              banned: true,
            },
          });
          if (!existing) return;

          const grantingSuperAdmin =
            user.isSuperAdmin === true && existing.isSuperAdmin !== true;
          const grantingScopes =
            Array.isArray(user.adminPermissions) &&
            existing.adminPermissions.length === 0 &&
            user.adminPermissions.length > 0;
          const grantingActions =
            Array.isArray(user.adminActions) &&
            existing.adminActions.length === 0 &&
            user.adminActions.length > 0;

          // Privilege fields are `input: false`, so this only fires when an
          // internal caller writes them. Still refuse to silently create a new
          // full administrator through generic user updates.
          if (grantingSuperAdmin && user.isSuperAdmin === true) {
            user.isSuperAdmin = false;
          }
          if (grantingScopes || grantingActions || grantingSuperAdmin) {
            logger.warn({
              message: "Blocked privilege grant through generic user update hook",
              userId: user.id,
            });
            delete user.adminPermissions;
            delete user.adminActions;
            delete user.isSuperAdmin;
          }
        },
        after: async (user) => {
          const existing = await prisma.user.findUnique({
            where: { id: user.id },
            select: { image: true, imagePublicId: true },
          });
          if (!existing) return;
          const nextPublicId = extractCloudinaryPublicId(user.image);
          if (existing.imagePublicId && existing.imagePublicId !== nextPublicId) {
            await deleteImages([existing.imagePublicId]);
          }
          if (existing.imagePublicId !== nextPublicId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { imagePublicId: nextPublicId },
            });
          }
          await attachMediaAssets([nextPublicId], "user", user.id, user.id);
        },
      },
      delete: {
        before: async (user) => {
          // The authoritative last-owner protection is the database trigger
          // created in `20261102022000_owner_guard_trigger`. It runs inside the
          // deleting transaction and serializes every deletion path (Better
          // Auth, self-service and direct SQL). This hook only converts the
          // database error into a clean API error.
          const existing = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              role: true,
              isSuperAdmin: true,
              staffStatus: true,
              banned: true,
            },
          });
          if (!existing) return;

          const isPrivileged =
            existing.role?.toLowerCase() === "admin" &&
            existing.isSuperAdmin &&
            existing.staffStatus === "ACTIVE" &&
            existing.banned !== true;
          if (!isPrivileged) return;

          const remaining = await countActiveSuperAdminsById(user.id);
          if (remaining === 0) {
            throw new APIError("FORBIDDEN", {
              message: "At least one active super admin must remain",
              code: "LAST_SUPER_ADMIN",
            });
          }
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "CUSTOMER",
      adminRoles: ["ADMIN"],
      bannedUserMessage: "Account suspended",
      roles: {
        ADMIN: adminAc,
        CUSTOMER: defaultAc.newRole({ user: [], session: [] }),
      },
    }),
  ],
});

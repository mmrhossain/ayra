import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, jwt } from "better-auth/plugins";
import { adminAc, defaultAc } from "better-auth/plugins/admin/access";
import { logger } from "../common/looger/logger.ts";
import { extractCloudinaryPublicId } from "../common/utils/cloudinary-public-id.ts";
import { env } from "../config/env.ts";
import { attachMediaAssets, deleteImages } from "../modules/media/media.service.ts";
import { getBaseEmailTemplate } from "../template/email.ts";
import { getPasswordResetEmailHtml, PASSWORD_RESET_SUBJECT } from "../template/password-reset.ts";
import { prisma } from "./prisma.ts";
import { createBetterAuthSecondaryStorage, redis } from "./redis.ts";
import { resend } from "./resend.ts";

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
  appName: "raangalay",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  ...(betterAuthSecondaryStorage ? { secondaryStorage: betterAuthSecondaryStorage } : {}),
  trustedOrigins: [env.FRONTEND_URL],

  // User configuration with additional fields and self-deletion enabled
  user: {
    additionalFields: {
      role: {
        type: ["vendor", "admin", "customer"],
        required: false,
        defaultValue: "customer",
        input: false, // don't allow user to set role
      },
      imagePublicId: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true, // allow user to change their profile image
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
    cookiePrefix: "rangalay",
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
          await attachMediaAssets([nextPublicId], "user", user.id);
        },
      },
    },
  },

  plugins: [
    jwt(),
    admin({
      defaultRole: "CUSTOMER",
      adminRoles: ["ADMIN"],
      bannedUserMessage: "Account suspended",
      roles: {
        ADMIN: adminAc,
        CUSTOMER: defaultAc.newRole({ user: [], session: [] }),
        VENDOR: defaultAc.newRole({ user: [], session: [] }),
      },
    }),
  ],
});

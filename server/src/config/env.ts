import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ override: false });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string(),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(20),
  DIRECT_URL: z.string(),

  // Inventory
  LOW_STOCK_THRESHOLD: z.coerce.number().int().min(0).default(10),

  // Redis (required in production)
  REDIS_URL: z.string().optional(),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(),

  // JWT
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),

  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),

  // SSLCommerz
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_SANDBOX: z.string().default("true"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().min(1),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Upload
  MAX_JSON_SIZE: z.string().default("1mb"),

  // Express
  URL_ENCODED: z.string().default("true"),

  // Rate Limit
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Reverse-proxy hop count for Express `trust proxy` / req.ip.
  // Cloudflare in front of Render/ALB/Nginx is typically 2.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(1),

  // Cache
  ENABLE_CACHE: z.string().default("false"),

  // API docs (Swagger UI). Enabled in non-production, or when set to "true".
  ENABLE_API_DOCS: z.string().optional(),

  // Admin credential (optional করে দেওয়া হয়েছে যাতে ফাইলে না থাকলেও ক্র্যাশ না করে)
  ADMIN_NAME: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_ROLE: z.string().optional(),
  ADMIN_EMAIL_VERIFIED: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "test") return;
  const url = data.REDIS_URL;
  if (!url || !(url.startsWith("redis://") || url.startsWith("rediss://"))) {
    ctx.addIssue({
      code: "custom",
      path: ["REDIS_URL"],
      message: "REDIS_URL (redis:// or rediss://) is required outside test",
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = {
  ...parsedEnv.data,

  isProduction: parsedEnv.data.NODE_ENV === "production",

  isDevelopment: parsedEnv.data.NODE_ENV === "development",

  enableCache: parsedEnv.data.ENABLE_CACHE === "true",

  urlEncoded: parsedEnv.data.URL_ENCODED === "true",

  enableApiDocs:
    parsedEnv.data.NODE_ENV !== "production" || parsedEnv.data.ENABLE_API_DOCS === "true",
};

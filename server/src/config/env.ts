import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ override: false });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string(),
  // Additional browser origins accepted by Better Auth (comma-separated).
  // Supports wildcards, e.g. "https://*.preview.example.com". Use this for
  // hosted preview/staging hosts without hardcoding them in source.
  EXTRA_TRUSTED_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    ),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(20),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DATABASE_KEEPALIVE_INITIAL_DELAY_MS: z.coerce.number().int().nonnegative().default(10000),
  // Interactive transaction budget. Cross-region databases (e.g. a remote Neon
  // endpoint) add ~250ms per round-trip, so a multi-variant product insert can
  // exceed the previous 10s cap. Keep this high enough for the heaviest write.
  DATABASE_TRANSACTION_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DATABASE_TRANSACTION_MAX_WAIT_MS: z.coerce.number().int().positive().default(10000),
  DIRECT_URL: z.string(),

  // Inventory
  LOW_STOCK_THRESHOLD: z.coerce.number().int().min(0).default(10),

  // Bangladesh geography reference API (server-side proxy with caching)
  GEO_API_URL: z
    .string()
    .url()
    .default("https://bd-geo-location.vercel.app/api/v1"),
  GEO_API_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  GEO_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(86400),

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
  BETTER_AUTH_APP_NAME: z.string().min(1).default("Ayra"),
  SETTINGS_ENCRYPTION_KEY: z.string().min(16).optional(),

  // SSLCommerz
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_SANDBOX: z.string().default("true"),
  PAYMENT_CALLBACK_BASE_URL: z.string().optional(),

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

  // Courier integrations (optional; booking/webhooks are disabled when unset)
  COURIER_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  PATHAO_BASE_URL: z.string().url().optional(),
  PATHAO_CLIENT_ID: z.string().optional(),
  PATHAO_CLIENT_SECRET: z.string().optional(),
  PATHAO_USERNAME: z.string().optional(),
  PATHAO_PASSWORD: z.string().optional(),
  PATHAO_STORE_ID: z.coerce.number().int().positive().optional(),
  PATHAO_DEFAULT_CITY_ID: z.coerce.number().int().positive().optional(),
  PATHAO_DEFAULT_ZONE_ID: z.coerce.number().int().positive().optional(),
  PATHAO_DEFAULT_AREA_ID: z.coerce.number().int().positive().optional(),
  PATHAO_WEBHOOK_SECRET: z.string().optional(),
  STEADFAST_BASE_URL: z.string().url().default("https://portal.packzy.com/api/v1"),
  STEADFAST_API_KEY: z.string().optional(),
  STEADFAST_SECRET_KEY: z.string().optional(),
  STEADFAST_WEBHOOK_SECRET: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  CLOUDINARY_DESTROY_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  CLOUDINARY_RECONCILE_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

  // Media upload path: bound the synchronous DB write so a suspended/unreachable
  // database fails fast with a clear error instead of hanging for DATABASE_QUERY_TIMEOUT_MS.
  MEDIA_DB_WRITE_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

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
    .default("true")
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

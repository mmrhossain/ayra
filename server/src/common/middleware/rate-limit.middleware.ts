import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { env } from "../../config/env.ts";
import { redis } from "../../lib/redis.ts";

const skipInTest = () => env.NODE_ENV === "test";

const SESSION_COOKIES = [
  "rangalay.session_token",
  "__Secure-rangalay.session_token",
] as const;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex").slice(0, 32);

const redisStore = (prefix: string) => {
  if (!redis) {
    if (env.NODE_ENV === "test") return undefined;
    throw new Error(`Redis is required for rate limit store (${prefix})`);
  }
  const client = redis;
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
    prefix,
  });
};

export const clientIp = (req: Request) => {
  return ipKeyGenerator(req.ip ?? "unknown");
};

export const identityKey = (req: Request) => {
  if (req.auth?.user.id) return req.auth.user.id;
  for (const name of SESSION_COOKIES) {
    const token = req.cookies?.[name];
    if (typeof token === "string" && token.length > 0) {
      return `sid:${hashToken(token)}`;
    }
  }
  return clientIp(req);
};

const isHealthCheck = (req: Request) =>
  req.path === "/health" || req.path === "/ready";

const isAuthSessionPoll = (req: Request) => {
  const path = (req.originalUrl ?? req.path).split("?")[0] ?? "";
  const normalized = path.replace(/\/+$/, "");
  return normalized.endsWith("/get-session") || normalized.endsWith("/auth/ok");
};

type CreateLimiterOptions = {
  windowMs: number;
  max: number;
  prefix: string;
  message: string;
  skip?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  passOnStoreError?: boolean;
};

const createLimiter = ({
  windowMs,
  max,
  prefix,
  message,
  skip,
  keyGenerator,
  passOnStoreError,
}: CreateLimiterOptions) => {
  const store = redisStore(prefix);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skip ?? skipInTest,
    passOnStoreError: passOnStoreError ?? false,
    keyGenerator: keyGenerator ?? clientIp,
    ...(store ? { store } : {}),
    handler: (_req, res, _next, options) => {
      const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(options.statusCode).json({
        success: false,
        message,
      });
    },
  });
};

const perEndpointLimiter = (
  windowMs: number,
  max: number,
  label: string,
  prefix: string,
  keyGenerator: (req: Request) => string = identityKey,
) =>
  createLimiter({
    windowMs,
    max,
    prefix,
    message: `Too many ${label} requests. Please try again later.`,
    keyGenerator,
    passOnStoreError: false,
  });

export const limiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  prefix: "global:rl:",
  message: "Too many requests. Please try again later.",
  skip: (req) => skipInTest() || isHealthCheck(req),
  keyGenerator: clientIp,
  passOnStoreError: false,
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: "auth:rl:",
  message: "Too many authentication requests. Please try again later.",
  skip: (req) => skipInTest() || isAuthSessionPoll(req),
  keyGenerator: clientIp,
  passOnStoreError: false,
});

export const checkoutLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  30,
  "checkout",
  "checkout:rl:",
);

export const paymentLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  40,
  "payment",
  "payment:rl:",
);

export const couponLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  20,
  "coupon",
  "coupon:rl:",
);

export const reviewLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  20,
  "review submission",
  "review:rl:",
);

export const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  prefix: "upload:rl:",
  message: "Too many upload requests. Please try again later.",
  keyGenerator: identityKey,
  passOnStoreError: false,
});

export const aiChatLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  prefix: "ai:rl:",
  message: "Too many AI requests. Please try again later.",
  skip: skipInTest,
  keyGenerator: identityKey,
  passOnStoreError: false,
});

export const searchLimiter = perEndpointLimiter(
  60 * 1000,
  40,
  "search",
  "search:rl:",
  clientIp,
);

export const listingLimiter = perEndpointLimiter(
  60 * 1000,
  120,
  "catalog",
  "listing:rl:",
  clientIp,
);

export const cartLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  80,
  "cart",
  "cart:rl:",
);

export const orderLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  40,
  "order",
  "order:rl:",
);

export const adminLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  120,
  "admin",
  "admin:rl:",
);

const normalizePath = (req: Request) => {
  const raw = (req.originalUrl ?? req.path).split("?")[0] ?? "";
  return raw.replace(/\/+$/, "") || "/";
};

export const domainLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (skipInTest()) {
    next();
    return;
  }

  const path = normalizePath(req);
  const method = req.method.toUpperCase();

  if (method === "POST" && (path === "/api/v1/checkout" || path === "/api/v1/cart/checkout")) {
    checkoutLimiter(req, res, next);
    return;
  }

  if (method === "POST" && /^\/api\/v1\/payments\/[^/]+\/initiate$/.test(path)) {
    paymentLimiter(req, res, next);
    return;
  }

  if (
    (method === "GET" && path === "/api/v1/coupons/validate") ||
    (method === "POST" && path === "/api/v1/cart/coupon")
  ) {
    couponLimiter(req, res, next);
    return;
  }

  if (
    (method === "POST" && /^\/api\/v1\/products\/[^/]+\/reviews$/.test(path)) ||
    (method === "PATCH" && /^\/api\/v1\/reviews\/[^/]+$/.test(path)) ||
    (method === "DELETE" && /^\/api\/v1\/reviews\/[^/]+$/.test(path))
  ) {
    reviewLimiter(req, res, next);
    return;
  }

  if (
    method === "POST" &&
    (path === "/api/v1/media/upload" || path === "/api/v1/media/uploads")
  ) {
    uploadLimiter(req, res, next);
    return;
  }

  if (method === "POST" && path === "/api/v1/ai/chat") {
    aiChatLimiter(req, res, next);
    return;
  }

  if (method === "GET" && path === "/api/v1/products" && req.query.search) {
    searchLimiter(req, res, next);
    return;
  }

  if (
    method === "GET" &&
    (path === "/api/v1/products" ||
      path === "/api/v1/categories" ||
      path === "/api/v1/brands" ||
      path === "/api/v1/home" ||
      path === "/api/v1/sliders/active" ||
      path === "/api/v1/blogs" ||
      /^\/api\/v1\/blogs\/[^/]+$/.test(path) ||
      /^\/api\/v1\/products\/[^/]+$/.test(path) ||
      /^\/api\/v1\/categories\/[^/]+$/.test(path) ||
      /^\/api\/v1\/products\/[^/]+\/reviews$/.test(path))
  ) {
    listingLimiter(req, res, next);
    return;
  }

  if (
    path === "/api/v1/cart" ||
    path === "/api/v1/cart/guest" ||
    path.startsWith("/api/v1/cart/")
  ) {
    cartLimiter(req, res, next);
    return;
  }

  if (
    (method === "GET" && (path === "/api/v1/orders" || /^\/api\/v1\/orders\/[^/]+$/.test(path))) ||
    (method === "POST" &&
      (/^\/api\/v1\/orders\/[^/]+\/cancel$/.test(path) ||
        /^\/api\/v1\/orders\/[^/]+\/return-request$/.test(path)))
  ) {
    orderLimiter(req, res, next);
    return;
  }

  if (path.startsWith("/api/v1/admin/")) {
    adminLimiter(req, res, next);
    return;
  }

  next();
};

import type { NextFunction, Request, Response } from "express";
import { ipKeyGenerator, MemoryStore, rateLimit } from "express-rate-limit";
import { AppError } from "../errors/AppError.ts";
import { logger } from "../looger/logger.ts";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { env } from "../../config/env.ts";
import { redis } from "../../lib/redis.ts";

const skipInTest = () => env.NODE_ENV === "test";

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

export const identityKey = (req: Request) => req.auth?.user.id ?? clientIp(req);

const normalizePath = (req: Request) =>
  ((req.originalUrl ?? req.path).split("?")[0] ?? "").replace(/\/+$/, "") || "/";

const isRead = (req: Request) => ["GET", "HEAD"].includes(req.method.toUpperCase());
const isQuote = (req: Request) => req.method === "POST" &&
  ["/api/v1/cart/guest/quote", "/api/v1/shipping/quote"].includes(normalizePath(req));
const isGatewayCallback = (req: Request) =>
  ["GET", "POST"].includes(req.method) &&
  /^\/api\/v1\/payments\/sslcommerz\/(success|failed|cancelled|ipn)$/.test(normalizePath(req));

const isHealthCheck = (req: Request) => req.path === "/health" || req.path === "/ready";

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
  readFallback?: boolean;
  skipSuccessfulRequests?: boolean;
};

const createLimiter = ({
  windowMs,
  max,
  prefix,
  message,
  skip,
  keyGenerator,
  readFallback = false,
  skipSuccessfulRequests = false,
}: CreateLimiterOptions) => {
  const store = redisStore(prefix);

  const options = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skip ?? skipInTest,
    skipSuccessfulRequests,
    passOnStoreError: false,
    keyGenerator: keyGenerator ?? clientIp,
    ...(store ? { store } : {}),
    handler: (_req: Request, res: Response, _next: NextFunction, options: { windowMs: number; statusCode: number }) => {
      // express-rate-limit already supplies the seconds remaining until reset.
      if (!res.hasHeader("Retry-After")) res.setHeader("Retry-After", String(Math.ceil(options.windowMs / 1000)));
      res.status(options.statusCode).json({
        success: false,
        message,
      });
    },
  };
  const primary = rateLimit(options);
  const fallback = store && readFallback
    ? rateLimit({ ...options, store: new MemoryStore() })
    : null;
  let outageLogged = false;
  return (req: Request, res: Response, next: NextFunction) => primary(req, res, (error?: unknown) => {
    if (!error) {
      outageLogged = false;
      next();
      return;
    }
    if (!outageLogged) {
      logger.warn({ message: "Rate limit store unavailable", prefix });
      outageLogged = true;
    }
    if (fallback) {
      void Promise.resolve(fallback(req, res, next)).catch(next);
      return;
    }
    res.setHeader("Retry-After", "5");
    next(new AppError("Request protection is temporarily unavailable. Please retry shortly.", 503, "RATE_LIMIT_UNAVAILABLE"));
  });
};

export const perEndpointLimiter = (
  windowMs: number,
  max: number,
  label: string,
  prefix: string,
  keyGenerator: (req: Request) => string = identityKey,
  readFallback = false,
) =>
  createLimiter({
    windowMs,
    max,
    prefix,
    message: `Too many ${label} requests. Please try again later.`,
    keyGenerator,
    readFallback,
  });

export const readLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_READ_WINDOW_MS,
  max: env.RATE_LIMIT_READ_MAX_REQUESTS,
  prefix: "read:rl:",
  message: "Too many read requests. Please try again shortly.",
  readFallback: true,
});
const writeLimiter = createLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  prefix: "global:rl:",
  message: "Too many requests. Please try again later.",
});
const gatewayLimiter = createLimiter({
  windowMs: 60_000,
  max: 240,
  prefix: "gateway:rl:",
  message: "Too many gateway callbacks. Please retry shortly.",
  readFallback: true,
});
export const limiter = (req: Request, res: Response, next: NextFunction) => {
  if (skipInTest() || isHealthCheck(req)) {
    return next();
  }
  if (isGatewayCallback(req)) {
    return gatewayLimiter(req, res, next);
  }
  return (isRead(req) || isQuote(req) ? readLimiter : writeLimiter)(req, res, next);
};

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: "auth:rl:",
  skipSuccessfulRequests: true,
  message: "Too many authentication requests. Please try again later.",
  skip: (req) => skipInTest() || isAuthSessionPoll(req),
  keyGenerator: clientIp,
});

export const checkoutLimiter = perEndpointLimiter(
  60 * 1000,
  5,
  "checkout",
  "checkout:user:rl:",
  (req) => req.auth?.user.id ?? identityKey(req)
);

export const paymentLimiter = perEndpointLimiter(15 * 60 * 1000, 40, "payment", "payment:rl:");

export const couponLimiter = perEndpointLimiter(15 * 60 * 1000, 20, "coupon", "coupon:rl:");

export const reviewLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  20,
  "review submission",
  "review:rl:"
);

export const contactLimiter = perEndpointLimiter(
  15 * 60 * 1000,
  5,
  "contact form",
  "contact:rl:",
  clientIp
);

export const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  prefix: "upload:rl:",
  message: "Too many upload requests. Please try again later.",
  keyGenerator: identityKey,
});

export const aiChatLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  prefix: "ai:rl:",
  message: "Too many AI requests. Please try again later.",
  skip: skipInTest,
  keyGenerator: identityKey,
});

export const searchLimiter = perEndpointLimiter(60 * 1000, 40, "search", "search:rl:", clientIp, true);
export const cartLimiter = perEndpointLimiter(15 * 60 * 1000, 80, "cart changes", "cart:rl:");
export const cartReadLimiter = perEndpointLimiter(60_000, 120, "cart reads", "cart:read:rl:", identityKey, true);
export const orderLimiter = perEndpointLimiter(15 * 60 * 1000, 40, "order changes", "order:rl:");
export const orderReadLimiter = perEndpointLimiter(60_000, 120, "order reads", "order:read:rl:", identityKey, true);
export const adminLimiter = perEndpointLimiter(15 * 60 * 1000, 120, "admin changes", "admin:rl:");
export const adminReadLimiter = perEndpointLimiter(60_000, 120, "admin reads", "admin:read:rl:", identityKey, true);
const guestQuoteLimiter = createLimiter({ windowMs: 60_000, max: 60, prefix: "guest:quote:rl:", message: "Too many cart quotes. Please retry shortly.", readFallback: true });

// Only public policies run here. Authenticated policies run after existing auth.
export const domainLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (skipInTest()) {
    return next();
  }
  const path = normalizePath(req);
  if (req.method === "POST" && path === "/api/v1/cart/guest/quote") {
    return guestQuoteLimiter(req, res, next);
  }
  if (req.method === "GET" && path === "/api/v1/products" && req.query.search) {
    return searchLimiter(req, res, next);
  }
  next();
};

export const authenticatedDomainLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (skipInTest()) {
    return next();
  }
  const path = normalizePath(req);
  const method = req.method.toUpperCase();
  if (!req.auth && path !== "/api/v1/ai/chat") {
    return next();
  }
  if (method === "POST" && /^\/api\/v1\/payments\/[^/]+\/initiate$/.test(path)) {
    return paymentLimiter(req, res, next);
  }
  if ((method === "GET" && path === "/api/v1/coupons/validate") || (method === "POST" && path === "/api/v1/cart/coupon")) {
    return couponLimiter(req, res, next);
  }
  if ((method === "POST" && /^\/api\/v1\/products\/[^/]+\/reviews$/.test(path)) || (["PATCH", "DELETE"].includes(method) && /^\/api\/v1\/reviews\/[^/]+$/.test(path))) {
    return reviewLimiter(req, res, next);
  }
  if (method === "POST" && ["/api/v1/media/upload", "/api/v1/media/uploads"].includes(path)) {
    return uploadLimiter(req, res, next);
  }
  if (method === "POST" && path === "/api/v1/ai/chat") {
    return aiChatLimiter(req, res, next);
  }
  if (path === "/api/v1/cart" || path.startsWith("/api/v1/cart/")) {
    return (isRead(req) ? cartReadLimiter : cartLimiter)(req, res, next);
  }
  if (path === "/api/v1/orders" || path.startsWith("/api/v1/orders/")) {
    return (isRead(req) ? orderReadLimiter : orderLimiter)(req, res, next);
  }
  if (path.startsWith("/api/v1/admin/")) {
    return (isRead(req) ? adminReadLimiter : adminLimiter)(req, res, next);
  }
  next();
};

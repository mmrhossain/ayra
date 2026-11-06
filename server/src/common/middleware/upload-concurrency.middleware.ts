import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { env } from "../../config/env.ts";
import { redis } from "../../lib/redis.ts";
import { CLOUDINARY_MAX_ATTEMPTS } from "../../lib/cloudinary.ts";
import {
  MAX_CONCURRENT_UPLOAD_REQUESTS,
  MAX_CONCURRENT_UPLOAD_REQUESTS_PER_USER,
} from "../../modules/media/media.constants.ts";

// A slot must outlive the slowest possible upload, otherwise a slow request
// releases its slot early (via the TTL) and the concurrency cap is undercounted.
// Worst case = all Cloudinary attempts time out sequentially.
const REDIS_TTL_SECONDS =
  Math.ceil((env.CLOUDINARY_UPLOAD_TIMEOUT_MS * CLOUDINARY_MAX_ATTEMPTS) / 1000) +
  60;

const USER_KEY = (userId: string) => `upload:inflight:user:${userId}`;
const GLOBAL_KEY = "upload:inflight:global";

// In-process fallback when Redis is unavailable, so a Redis outage degrades the
// cap instead of rejecting every upload (previous behaviour was fail-closed).
const localCounts = new Map<string, number>();

const incr = async (key: string): Promise<number> => {
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, REDIS_TTL_SECONDS);
    return count;
  }
  const next = (localCounts.get(key) ?? 0) + 1;
  localCounts.set(key, next);
  return next;
};

const decr = async (key: string): Promise<void> => {
  if (redis) {
    const remaining = await redis.decr(key);
    if (remaining < 0) await redis.set(key, "0");
    return;
  }
  const next = Math.max(0, (localCounts.get(key) ?? 0) - 1);
  localCounts.set(key, next);
};

const tooMany = () =>
  new AppError("Too many concurrent uploads. Please retry shortly.", 429);

export { MAX_CONCURRENT_UPLOAD_REQUESTS, MAX_CONCURRENT_UPLOAD_REQUESTS_PER_USER };

export const uploadConcurrencyGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const userId = req.auth?.user.id ?? "anonymous";
  const userKey = USER_KEY(userId);

  try {
    const userCount = await incr(userKey);
    if (userCount > MAX_CONCURRENT_UPLOAD_REQUESTS_PER_USER) {
      await decr(userKey);
      next(tooMany());
      return;
    }

    const globalCount = await incr(GLOBAL_KEY);
    if (globalCount > MAX_CONCURRENT_UPLOAD_REQUESTS) {
      await decr(GLOBAL_KEY);
      await decr(userKey);
      next(tooMany());
      return;
    }

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      void Promise.allSettled([decr(userKey), decr(GLOBAL_KEY)]);
    };
    _res.once("finish", release);
    _res.once("close", release);
    next();
  } catch {
    next(tooMany());
  }
};

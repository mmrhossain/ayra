import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { env } from "../../config/env.ts";
import { redis } from "../../lib/redis.ts";
import { MAX_CONCURRENT_UPLOAD_REQUESTS } from "../../modules/media/media.constants.ts";

const REDIS_KEY = "upload:inflight";
const REDIS_TTL_SECONDS = 120;

const acquireRedisSlot = async (): Promise<boolean> => {
  if (!redis) return false;
  const count = await redis.incr(REDIS_KEY);
  if (count === 1) {
    await redis.expire(REDIS_KEY, REDIS_TTL_SECONDS);
  }
  if (count > MAX_CONCURRENT_UPLOAD_REQUESTS) {
    await redis.decr(REDIS_KEY);
    return false;
  }
  return true;
};

const releaseRedisSlot = async (): Promise<void> => {
  if (!redis) return;
  try {
    const remaining = await redis.decr(REDIS_KEY);
    if (remaining < 0) {
      await redis.set(REDIS_KEY, "0");
    }
  } catch {
  }
};

export { MAX_CONCURRENT_UPLOAD_REQUESTS };

export const uploadConcurrencyGuard = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (env.NODE_ENV === "test") {
    next();
    return;
  }

  try {
    if (!redis) {
      next(
        new AppError("Too many concurrent uploads. Please retry shortly.", 429)
      );
      return;
    }

    const acquired = await acquireRedisSlot();
    if (!acquired) {
      next(
        new AppError("Too many concurrent uploads. Please retry shortly.", 429)
      );
      return;
    }

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      void releaseRedisSlot();
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  } catch {
    next(new AppError("Too many concurrent uploads. Please retry shortly.", 429));
  }
};

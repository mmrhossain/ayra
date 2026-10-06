import Redis from "ioredis";
import { logger } from "../common/looger/logger.ts";
import { env } from "../config/env.ts";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

const MAX_RETRY_ATTEMPTS = 3;

function isRedisUrl(value: string): boolean {
  return value.startsWith("redis://") || value.startsWith("rediss://");
}

function createRedisClient(): Redis | null {
  const url = env.REDIS_URL;

  if (!url || !isRedisUrl(url)) {
    if (env.NODE_ENV !== "test") {
      logger.error("REDIS_URL (redis:// or rediss://) is required outside test");
      process.exit(1);
    }
    return null;
  }

  try {
    const useTls = url.startsWith("rediss://");
    let errorLogged = false;

    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: true,
      connectTimeout: 10_000,
      retryStrategy: (times) => {
        if (times > MAX_RETRY_ATTEMPTS) {
          return null;
        }
        return Math.min(500 * 2 ** (times - 1), 4000);
      },
      ...(useTls ? { tls: {} } : {}),
    });

    client.on("error", (err) => {
      if (!errorLogged) {
        errorLogged = true;
        logger.warn(`Redis connection error: ${err.message}`);
      }
    });

    client.on("ready", () => {
      logger.info("Redis connected");
    });

    return client;
  } catch (err) {
    const message = `Redis client creation failed: ${(err as Error).message}`;
    if (env.NODE_ENV !== "test") {
      logger.error(message);
      process.exit(1);
    }
    logger.warn(message);
    return null;
  }
}

export const redis = (() => {
  if (globalForRedis.redis === undefined) {
    globalForRedis.redis = createRedisClient();
  }
  return globalForRedis.redis;
})();

export async function redisGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    logger.warn(`Redis get failed (${key}): ${(err as Error).message}`);
    return null;
  }
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch (err) {
    logger.warn(`Redis set failed (${key}): ${(err as Error).message}`);
  }
}

export async function redisDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(`Redis del failed (${key}): ${(err as Error).message}`);
  }
}

const BETTER_AUTH_KEY_PREFIX = "better-auth:";

export function createBetterAuthSecondaryStorage(client: Redis) {
  const namespaced = (key: string) => `${BETTER_AUTH_KEY_PREFIX}${key}`;

  return {
    async get(key: string): Promise<string | null> {
      return client.get(namespaced(key));
    },

    async getAndDelete(key: string): Promise<string | null> {
      return client.getdel(namespaced(key));
    },

    async increment(key: string, ttl: number): Promise<number> {
      if (!Number.isInteger(ttl) || ttl <= 0) {
        throw new TypeError("Redis increment TTL must be a positive integer");
      }

      const namespacedKey = namespaced(key);
      const results = await client
        .multi()
        .incr(namespacedKey)
        .expire(namespacedKey, ttl, "NX")
        .exec();

      const first = results?.[0];
      if (!first) {
        throw new Error("Redis increment returned no result");
      }

      const [incrError, count] = first;
      if (incrError) {
        throw incrError;
      }

      return typeof count === "number" ? count : Number(count ?? 0);
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      const namespacedKey = namespaced(key);
      if (ttl) {
        await client.set(namespacedKey, value, "EX", ttl);
        return;
      }
      await client.set(namespacedKey, value);
    },

    async delete(key: string): Promise<void> {
      await client.del(namespaced(key));
    },
  };
}

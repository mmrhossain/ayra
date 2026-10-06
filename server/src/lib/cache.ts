import { env } from "../config/env.ts";
import { redisDel, redisGet, redisSet } from "./redis.ts";

const TTL = {
  home: 120,
  product: 120,
  category: 300,
  brand: 300,
} as const;

export const CacheKeys = {
  home: "cache:home:aggregate",
  productSlug: (slug: string) => `cache:product:slug:${slug}`,
  categoryTree: (includeInactive: boolean) =>
    `cache:category:tree:${includeInactive ? "all" : "active"}`,
  brands: "cache:brand:list",
} as const;

export const isCacheEnabled = () =>
  env.NODE_ENV !== "test" && env.enableCache;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isCacheEnabled()) return null;
  const hit = await redisGet(key);
  if (!hit) return null;
  try {
    return JSON.parse(hit) as T;
  } catch {
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> => {
  if (!isCacheEnabled()) return;
  await redisSet(key, JSON.stringify(value), ttlSeconds);
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
  await Promise.all(keys.map((key) => redisDel(key)));
};

export const CacheTtl = TTL;

export const invalidateCatalogCache = async (opts?: {
  productSlug?: string;
  previousSlug?: string;
}): Promise<void> => {
  const keys = [
    CacheKeys.home,
    CacheKeys.categoryTree(false),
    CacheKeys.categoryTree(true),
    CacheKeys.brands,
  ];
  if (opts?.productSlug) keys.push(CacheKeys.productSlug(opts.productSlug));
  if (opts?.previousSlug && opts.previousSlug !== opts.productSlug) {
    keys.push(CacheKeys.productSlug(opts.previousSlug));
  }
  await cacheDel(...keys);
};

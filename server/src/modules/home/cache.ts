import {
  CacheKeys,
  CacheTtl,
  cacheDel,
  cacheGet,
  cacheSet,
} from "../../lib/cache.ts";
import type { HomePayload } from "./types.ts";

export const HOME_CACHE_KEY = CacheKeys.home;
export const HOME_CACHE_TTL_SECONDS = CacheTtl.home;

export const readCachedHome = async (): Promise<HomePayload | null> => {
  return cacheGet<HomePayload>(HOME_CACHE_KEY);
};

export const writeCachedHome = async (payload: HomePayload): Promise<void> => {
  await cacheSet(HOME_CACHE_KEY, payload, HOME_CACHE_TTL_SECONDS);
};

export const invalidateHomeCache = async (): Promise<void> => {
  await cacheDel(HOME_CACHE_KEY);
};

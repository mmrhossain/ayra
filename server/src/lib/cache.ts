import { env } from "../config/env.ts";
import { prisma } from "./prisma.ts";
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
    `cache:category:tree:v3:${includeInactive ? "all" : "active"}`,
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

const FACETS_GENERATION_KEY = "cache:facets:generation";

export const getFacetsGeneration = async (): Promise<string> => {
  const value = await cacheGet<string>(FACETS_GENERATION_KEY);
  return typeof value === "string" && value ? value : "0";
};

export const bumpFacetsGeneration = async (): Promise<void> => {
  await cacheSet(FACETS_GENERATION_KEY, String(Date.now()), TTL.category * 12);
};

export const invalidateCatalogCache = async (opts?: {
  productSlug?: string;
  previousSlug?: string;
}): Promise<void> => {
  await bumpFacetsGeneration();
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

/**
 * Invalidates the cached public detail of every product that uses one of the
 * given attribute values. Needed when an attribute value's label or swatch
 * color changes, because the product payload embeds the resolved value.
 */
export const invalidateCatalogCacheForAttributeValues = async (
  attributeValueIds: string[],
): Promise<void> => {
  const ids = [...new Set(attributeValueIds.filter(Boolean))];
  if (ids.length === 0) {
    await invalidateCatalogCache();
    return;
  }
  const links = await prisma.variantAttribute.findMany({
    where: { attributeValueId: { in: ids } },
    select: { variant: { select: { product: { select: { slug: true } } } } },
  });
  const slugs = [
    ...new Set(
      links
        .map((link) => link.variant?.product?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];
  await invalidateCatalogCache();
  if (slugs.length) {
    await cacheDel(...slugs.map((slug) => CacheKeys.productSlug(slug)));
  }
};

/**
 * Invalidates the catalog cache after a mutation that only knows the affected
 * variant ids (variant CRUD, stock adjustments/transfers). Resolves the owning
 * product slugs so their cached public detail is dropped too.
 */
export const invalidateCatalogCacheForVariants = async (
  variantIds: Array<string | null | undefined>,
): Promise<void> => {
  const ids = [...new Set(variantIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) {
    await invalidateCatalogCache();
    return;
  }
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    select: { product: { select: { slug: true } } },
  });
  const slugs = [
    ...new Set(variants.map((variant) => variant.product.slug).filter(Boolean)),
  ];
  await invalidateCatalogCache();
  if (slugs.length) {
    await cacheDel(...slugs.map((slug) => CacheKeys.productSlug(slug)));
  }
};

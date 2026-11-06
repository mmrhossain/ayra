import { createHash } from "node:crypto";
import { prisma } from "../../../../lib/prisma.ts";
import {
  CacheTtl,
  cacheGet,
  cacheSet,
  getFacetsGeneration,
} from "../../../../lib/cache.ts";
import { resolveCategoryByPath } from "../../category/services/category.service.ts";
import type { ListProductsQuery } from "../types/product.types.ts";
import { buildProductWhere } from "./product-where.service.ts";

export type PriceBucket = { from: number; to: number };
export type FacetOption = { valueId: string; label: string; color?: string | null };
export type FacetAttribute = {
  attributeId: string;
  name: string;
  options: FacetOption[];
};
export type FacetCategory = { id: string; slug: string; label: string };

export type ProductFacets = {
  price: { min: number | null; max: number | null; buckets: PriceBucket[] };
  categories?: FacetCategory[];
  attributes: FacetAttribute[];
};

const BUCKET_TARGET = 6;

const niceStep = (raw: number): number => {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
};

export const buildPriceBuckets = (
  min: number | null,
  max: number | null,
): PriceBucket[] => {
  if (min === null || max === null) return [];
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max <= min) return [];

  const step = niceStep((max - min) / BUCKET_TARGET);
  const start = Math.floor(min / step) * step;
  const buckets: PriceBucket[] = [];
  let from = start;
  while (from < max && buckets.length < BUCKET_TARGET + 1) {
    const to = from + step;
    buckets.push({ from, to });
    from = to;
  }
  return buckets;
};

const facetsCacheKey = (
  generation: string,
  query: ListProductsQuery,
): string => {
  const fingerprint = JSON.stringify({
    category: query.category ?? null,
    brand: query.brand ?? null,
    search: query.search ?? null,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    featured: query.featured ?? null,
    onSale: query.onSale ?? null,
    includeInactive: query.includeInactive ?? null,
    status: query.status ?? null,
    attrs: query.attrs ?? null,
    categories: query.categories ?? null,
  });
  const hash = createHash("sha1").update(fingerprint).digest("hex").slice(0, 16);
  return `cache:facets:${generation}:${hash}`;
};

const resolveFacetCategories = async (
  query: ListProductsQuery,
): Promise<FacetCategory[]> => {
  if (!query.category) return [];

  const resolved = await resolveCategoryByPath(
    query.category,
    query.includeInactive === true,
  );
  if (!resolved) return [];

  const children = await prisma.category.findMany({
    where: {
      parentId: resolved.id,
      deletedAt: null,
      ...(query.includeInactive ? {} : { isActive: true }),
    },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return children.map((child) => ({
    id: child.id,
    slug: child.slug,
    label: child.name,
  }));
};

export const getProductFacets = async (
  query: ListProductsQuery,
): Promise<ProductFacets> => {
  const generation = await getFacetsGeneration();
  const cacheKey = facetsCacheKey(generation, query);
  const cached = await cacheGet<ProductFacets>(cacheKey);
  if (cached) return cached;

  const productWhere = await buildProductWhere(query);

  const [priceAggregate, attributeValues, categories] = await Promise.all([
    prisma.productVariant.aggregate({
      where: { deletedAt: null, product: productWhere },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.attributeValue.findMany({
      where: {
        deletedAt: null,
        attribute: { deletedAt: null },
        variants: {
          some: { variant: { deletedAt: null, product: productWhere } },
        },
      },
      select: {
        id: true,
        value: true,
        color: true,
        attribute: { select: { id: true, name: true } },
      },
    }),
    resolveFacetCategories(query),
  ]);

  const min =
    priceAggregate._min.price === null ? null : Number(priceAggregate._min.price);
  const max =
    priceAggregate._max.price === null ? null : Number(priceAggregate._max.price);

  const grouped = new Map<string, FacetAttribute>();
  for (const value of attributeValues) {
    const attributeId = value.attribute.id;
    let group = grouped.get(attributeId);
    if (!group) {
      group = { attributeId, name: value.attribute.name, options: [] };
      grouped.set(attributeId, group);
    }
    group.options.push({
      valueId: value.id,
      label: value.value,
      color: value.color ?? null,
    });
  }

  const result: ProductFacets = {
    price: { min, max, buckets: buildPriceBuckets(min, max) },
    attributes: [...grouped.values()]
      .map((group) => ({
        ...group,
        options: [...group.options].sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  if (categories.length > 0) result.categories = categories;

  await cacheSet(cacheKey, result, CacheTtl.category);
  return result;
};

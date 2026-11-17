import type { ProductListItem } from "../types";
export function productCardPricing(product: Pick<ProductListItem, "variants">) {
  const variant = product.variants.reduce<(typeof product.variants)[number] | undefined>((cheapest, candidate) => {
    const price = Number(candidate.price);
    if (!Number.isFinite(price) || price <= 0) return cheapest;
    return !cheapest || price < Number(cheapest.price) ? candidate : cheapest;
  }, undefined);
  const price = variant ? Number(variant.price) : null;
  const reference = Number(variant?.compareAtPrice);
  const compareAt = price !== null && Number.isFinite(reference) && reference > price ? reference : null;
  return {
    variantId: variant?.id ?? null,
    price,
    compareAt,
    discountPct: price !== null && compareAt !== null ? Math.round((1 - price / compareAt) * 100) : 0
  };
}

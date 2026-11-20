"use client";

import { useStorefrontCountQuery } from "@/hooks/useStorefrontCounts";
import { useWishStore } from "@/stores/useWishStore";

export function useWishlist() {
  const { query, ownerReady } = useStorefrontCountQuery("wishlist");
  const items = useWishStore(state => state.wishes);
  const count = useWishStore(state => state.wishCount);
  return { query, items: ownerReady ? items : null, count };
}

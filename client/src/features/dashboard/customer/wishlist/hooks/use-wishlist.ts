"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWishlistItems } from "@/features/dashboard/customer/wishlist/api/wishlist";
import type { WishlistListResult } from "@/features/dashboard/customer/wishlist/types";

export function useWishlist({
  initialData,
}: {
  initialData: WishlistListResult;
}) {
  const query = useQuery({
    queryKey: ["customer-wishlist"],
    queryFn: () => fetchWishlistItems({ page: 1, limit: 50 }),
    initialData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return {
    query,
    data,
    items: data.items,
    pagination: data.pagination,
  };
}

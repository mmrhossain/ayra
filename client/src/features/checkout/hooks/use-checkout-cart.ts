"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchMyCart } from "@/features/checkout/api";
import { useStorefrontOwner } from "@/hooks/useStorefrontCounts";

// All mounted checkout consumers share one read. Nothing is retained once the
// checkout unmounts, and the server recalculates everything on order placement.
export function useCheckoutCart() {
  const { ownerId, ownerReady } = useStorefrontOwner();
  return useQuery({
    queryKey: ["checkout-cart", ownerId],
    queryFn: fetchMyCart,
    enabled: ownerReady && Boolean(ownerId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

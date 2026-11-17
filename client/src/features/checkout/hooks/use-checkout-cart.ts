"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchMyCart } from "@/features/checkout/api";

// All mounted checkout consumers share one read. Nothing is retained once the
// checkout unmounts, and the server recalculates everything on order placement.
export function useCheckoutCart() {
  return useQuery({
    queryKey: ["checkout-cart"],
    queryFn: fetchMyCart,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

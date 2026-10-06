"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyCart } from "@/features/checkout/api";
import { fetchShippingOptions } from "@/features/shipping/shipping-api";

export function useCheckoutShipping(district: string) {
  const cartQuery = useQuery({
    queryKey: ["checkout-cart"],
    queryFn: fetchMyCart,
    staleTime: 15_000,
  });
  const cartSubtotal = Number(cartQuery.data?.subtotal ?? 0);

  const optionsQuery = useQuery({
    queryKey: ["checkout-shipping-options", district, cartSubtotal],
    queryFn: () =>
      fetchShippingOptions({
        district,
        subtotal: cartSubtotal,
      }),
    enabled: Boolean(district),
    staleTime: 15_000,
  });

  return {
    cartQuery,
    optionsQuery,
    cartSubtotal,
    shippingOptions: optionsQuery.data?.options ?? [],
  };
}

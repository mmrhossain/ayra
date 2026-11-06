"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyCart } from "@/features/checkout/api";
import { fetchShippingOptions } from "@/features/shipping/shipping-api";

export function useCheckoutShipping(district: string, districtCode?: string) {
  const cartQuery = useQuery({
    queryKey: ["checkout-cart"],
    queryFn: fetchMyCart,
    staleTime: 15_000,
  });
  const cartSubtotal = Number(cartQuery.data?.subtotal ?? 0);
  const cartDiscount = Number(cartQuery.data?.discountAmount ?? 0);
  const shippingSubtotal = Math.max(0, cartSubtotal - cartDiscount);

  const optionsQuery = useQuery({
    queryKey: [
      "checkout-shipping-options",
      district,
      districtCode,
      shippingSubtotal,
    ],
    queryFn: () =>
      fetchShippingOptions({
        district,
        districtCode,
        subtotal: shippingSubtotal,
      }),
    enabled: Boolean(district || districtCode),
    staleTime: 15_000,
  });

  return {
    cartQuery,
    optionsQuery,
    cartSubtotal,
    shippingOptions: optionsQuery.data?.options ?? [],
  };
}

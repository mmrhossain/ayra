"use client";

import { useQuery } from "@tanstack/react-query";
import { useCheckoutCart } from "./use-checkout-cart";
import { fetchShippingOptions } from "@/features/shipping/shipping-api";
import { locationStore } from "@/stores/location.store";

export function useCheckoutShipping() {
  const district = locationStore(state => state.formState.district);
  const districtCode = locationStore(state =>
    state.formState.districtCode ||
    state.districtList?.find(entry => entry.name === district)?.code ||
    "",
  );
  const cartQuery = useCheckoutCart();
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
    enabled: cartQuery.isSuccess && Boolean(cartQuery.data?.items.length) && Boolean(district || districtCode),
    staleTime: 30_000,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    cartQuery,
    districtCode,
    optionsQuery,
    cartSubtotal,
    shippingOptions: (optionsQuery.data?.options ?? []).map(option => cartQuery.data?.freeShipping ? { ...option, shippingAmount: 0, isFreeShipping: true } : option),
  };
}

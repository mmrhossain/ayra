"use client";

import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole } from "@/lib/api/auth/roles";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";
import { useIsFetching, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function useStorefrontCountBadge(kind: "cart" | "wishlist", initialIsCustomer = false) {
  const { data: session, isPending } = authClient.useSession();
  const ownerId = session?.user?.id ?? null;
  const staff = isStaffRole(session?.user?.role);
  const cartCount = useCartStore(state =>
    kind === "cart" && state.cart !== null ? state.cartCount : null);
  const wishCount = useWishStore(state =>
    kind === "wishlist" && state.wishes !== null ? state.wishCount : null);
  const count = kind === "cart" ? cartCount : wishCount;
  const queryKey = kind === "cart" ? ["storefront-cart", ownerId ?? "guest"] : ["storefront-wishlist", ownerId];
  const fetching = useIsFetching({
    queryKey,
    exact: true,
    predicate: query => query.state.data === undefined,
  }) > 0;
  const expected = !staff && (kind === "cart" || Boolean(ownerId) || (isPending && initialIsCustomer));

  return {
    count: expected ? count ?? 0 : 0,
    loading: expected && (count === null || fetching),
  };
}

export function useStorefrontCounts() {
  const { data: session, isPending } = authClient.useSession();
  const loggedIn = Boolean(session?.user);
  const staff = isStaffRole(session?.user?.role);
  const ownerId = session?.user?.id ?? null;
  const previousOwner = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (isPending) return;
    if (previousOwner.current !== undefined && previousOwner.current !== ownerId) {
      useCartStore.getState().clearCart();
      useWishStore.getState().clearWish();
    }
    previousOwner.current = ownerId;
  }, [isPending, ownerId]);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishList = useWishStore((s) => s.fetchWishList);

  // ১. কার্ট সবসময় ফেচ হবে (লগইন থাকুক বা না থাকুক / গেস্ট কার্ট হোক)
  useQuery({
    queryKey: ["storefront-cart", ownerId ?? "guest"],
    queryFn: async () => {
      await fetchCart();
      return true;
    },
    enabled: !isPending && !staff,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useQuery({
    queryKey: ["storefront-wishlist", ownerId],
    queryFn: async () => {
      await fetchWishList();
      return true;
    },
    enabled: !isPending && loggedIn && !staff,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

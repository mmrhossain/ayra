"use client";

import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole } from "@/lib/api/auth/roles";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";

type CountKind = "cart" | "wishlist";
const useCountOwner = create<{ id: string | null | undefined }>(() => ({ id: undefined }));

export const storefrontCountKey = (kind: CountKind, ownerId: string | null) =>
  [`storefront-${kind}`, ownerId] as const;

function useCountQuery(kind: CountKind, ownerId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: storefrontCountKey(kind, ownerId),
    queryFn: async () => {
      if (kind === "cart") await useCartStore.getState().fetchCart(ownerId ? "customer" : "guest");
      else await useWishStore.getState().fetchWishList(true);
      return true;
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    throwOnError: false,
  });
}

export function useStorefrontOwner() {
  const { data: session, isPending } = authClient.useSession();
  const ownerId = session?.user?.id ?? null;
  const activeOwner = useCountOwner(state => state.id);
  return { ownerId, ownerReady: !isPending && activeOwner === ownerId };
}

export function useStorefrontCountQuery(kind: CountKind) {
  const { ownerId, ownerReady } = useStorefrontOwner();
  const query = useCountQuery(kind, ownerId, false);
  return { query, ownerReady };
}

export function useStorefrontCountBadge(kind: CountKind, initialIsCustomer = false) {
  const { data: session, isPending } = authClient.useSession();
  const ownerId = session?.user?.id ?? null;
  const staff = isStaffRole(session?.user?.role);
  const activeOwner = useCountOwner(state => state.id);
  const cartCount = useCartStore(state =>
    kind === "cart" && state.cart !== null ? state.cartCount : null);
  const wishCount = useWishStore(state =>
    kind === "wishlist" && state.wishes !== null ? state.wishCount : null);
  const count = kind === "cart" ? cartCount : wishCount;
  const query = useCountQuery(kind, ownerId, false);
  const expected = !staff && (kind === "cart" || Boolean(ownerId) || (isPending && initialIsCustomer));

  return {
    count: expected && activeOwner === ownerId ? count : null,
    loading: expected && (activeOwner !== ownerId || count === null) && !query.isError,
  };
}

export function useStorefrontCounts() {
  const { data: session, isPending } = authClient.useSession();
  const staff = isStaffRole(session?.user?.role);
  const ownerId = session?.user?.id ?? null;
  const client = useQueryClient();
  const activeOwner = useCountOwner(state => state.id);

  useEffect(() => {
    if (isPending) return;
    if (useCountOwner.getState().id !== ownerId) {
      useCartStore.getState().clearCart();
      useCartStore.setState({ cart: null });
      useWishStore.getState().clearWish();
      useWishStore.setState({ wishes: null });
      client.removeQueries({
        predicate: ({ queryKey }) =>
          (queryKey[0] === "storefront-cart" || queryKey[0] === "storefront-wishlist") &&
          queryKey[1] !== ownerId,
      });
      useCountOwner.setState({ id: ownerId });
    }
  }, [client, isPending, ownerId]);

  const enabled = !isPending && !staff && activeOwner === ownerId;
  useCountQuery("cart", ownerId, enabled);
  useCountQuery("wishlist", ownerId, enabled && Boolean(ownerId));
}

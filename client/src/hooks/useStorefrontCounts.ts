"use client";

import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole } from "@/lib/api/auth/roles";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";
import { useQuery } from "@tanstack/react-query";

export function useStorefrontCounts() {
  const { data: session, isPending } = authClient.useSession();
  const loggedIn = Boolean(session?.user);
  const staff = isStaffRole(session?.user?.role);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishList = useWishStore((s) => s.fetchWishList);

  // ১. কার্ট সবসময় ফেচ হবে (লগইন থাকুক বা না থাকুক / গেস্ট কার্ট হোক)
  useQuery({
    queryKey: ["storefront-cart"],
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
    queryKey: ["storefront-wishlist"],
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

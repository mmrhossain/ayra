"use client";

import {
  toWishlistErrorMessage } from "@/features/dashboard/customer/wishlist/api/wishlist";
import { errorToast,
  successToast } from "@/helpers/index";
import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole,
  STAFF_CANNOT_SHOP_MESSAGE,
  staffShoppingRedirect } from "@/lib/api/auth/roles";
import { DashboardApiError } from "@/lib/api/dashboard";
import { useWishStore } from "@/stores/useWishStore";
import { useStorefrontOwner } from "@/hooks/useStorefrontCounts";
import { usePathname,
  useRouter } from "next/navigation";


export function useWishlistToggle(variantId: string | null | undefined) {
  const { data: session } = authClient.useSession();
  const { ownerReady } = useStorefrontOwner();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = Boolean(session?.user);
  const isInWishlist = useWishStore(s => Boolean(variantId && s.wishes?.some(item => item.variantId === variantId)));
  const addToWish = useWishStore((s) => s.addToWish);
  const removeFromWishList = useWishStore((s) => s.removeFromWishList);
  const variantLoading = useWishStore(s => Boolean(variantId && s.wishLoading[variantId]));
  const setWishLoading = useWishStore((s) => s.setWishLoading);
  // The storefront provider loads the shared wishlist once for all cards.

  const inWish = Boolean(
    ownerReady && isLoggedIn && variantId && isInWishlist,
  );
  const busy = Boolean(variantId && ((isLoggedIn && !ownerReady) || variantLoading));

  const toggleWishlist = async () => {
    if (!variantId) {
      errorToast("Select a variant");
      return;
    }
    if (!isLoggedIn) {
      errorToast("Please sign in to manage your wishlist");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const dest = staffShoppingRedirect(session?.user?.role);
    if (dest || isStaffRole(session?.user?.role)) {
      errorToast(STAFF_CANNOT_SHOP_MESSAGE);
      if (dest) router.push(dest);
      return;
    }
    if (busy) return;

    setWishLoading(variantId, true);
    try {
      if (inWish) {
        const res = await removeFromWishList(variantId);
        successToast(res.message);
      } else {
        const res = await addToWish(variantId);
        successToast(res.message);
      }
    } catch (err) {
      errorToast(toWishlistErrorMessage(err));
      if (err instanceof DashboardApiError && err.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    } finally {
      setWishLoading(variantId, false);
    }
  };

  return { inWish, busy, isLoggedIn, toggleWishlist };
}

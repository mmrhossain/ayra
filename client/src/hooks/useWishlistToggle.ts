"use client";

import { toWishlistErrorMessage } from "@/features/dashboard/customer/wishlist/api/wishlist";
import { errorToast, successToast } from "@/helpers/index";
import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole, STAFF_CANNOT_SHOP_MESSAGE, staffShoppingRedirect } from "@/lib/api/auth/roles";
import { DashboardApiError } from "@/lib/api/dashboard";
import { useWishStore } from "@/stores/useWishStore";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useWishlistToggle(variantId: string | null | undefined) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = Boolean(session?.user);
  const wishes = useWishStore((s) => s.wishes);
  const addToWish = useWishStore((s) => s.addToWish);
  const removeFromWishList = useWishStore((s) => s.removeFromWishList);
  const wishLoading = useWishStore((s) => s.wishLoading);
  const setWishLoading = useWishStore((s) => s.setWishLoading);
  const fetchWishList = useWishStore((s) => s.fetchWishList);

  useEffect(() => {
    if (isLoggedIn && !isStaffRole(session?.user?.role) && wishes === null) {
      void fetchWishList();
    }
  }, [isLoggedIn, session?.user?.role, wishes, fetchWishList]);

  const inWish = Boolean(
    variantId && wishes?.some((item) => item.variantId === variantId),
  );
  const busy = Boolean(variantId && wishLoading[variantId]);

  const toggleWishlist = useCallback(async () => {
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
  }, [
    addToWish,
    busy,
    inWish,
    isLoggedIn,
    pathname,
    removeFromWishList,
    router,
    session?.user?.role,
    setWishLoading,
    variantId,
  ]);

  return { inWish, busy, isLoggedIn, toggleWishlist };
}

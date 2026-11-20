"use client";

import { useMutation } from "@tanstack/react-query";
import { toWishlistErrorMessage } from "@/features/dashboard/customer/wishlist/utils";
import { errorToast } from "@/helpers";
import { useWishStore } from "@/stores/useWishStore";

export function useRemoveWishlistMutation() {
  return useMutation({
    mutationFn: (variantId: string) => useWishStore.getState().removeFromWishList(variantId),
    onError: (err) => {
      errorToast(toWishlistErrorMessage(err));
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeWishlistItem } from "@/features/dashboard/customer/wishlist/api/wishlist";
import { toWishlistErrorMessage } from "@/features/dashboard/customer/wishlist/utils";
import { errorToast } from "@/helpers";
import { useWishStore } from "@/stores/useWishStore";

export function useRemoveWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => removeWishlistItem(variantId),
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["customer-wishlist"] });
      await useWishStore.getState().fetchWishList();
      return result;
    },
    onError: (err) => {
      errorToast(toWishlistErrorMessage(err));
    },
  });
}

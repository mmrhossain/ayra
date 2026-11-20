import {
  addWishlistItem,
  fetchWishlistItems,
  wishlistRequest,
  removeWishlistItem,
  type WishlistItem,
} from "@/features/dashboard/customer/wishlist/api/wishlist";
import { DashboardApiError } from "@/lib/api/dashboard";
import type { WishState } from "@/features/dashboard/customer/wishlist/types";
import { create } from "zustand";

let wishlistGeneration = 0;
let wishlistOwnerGeneration = 0;

export const useWishStore = create<WishState>((set, get) => ({
  wishListLoading: false,
  setWishListLoading: (value: boolean) => {
    set({ wishListLoading: value });
  },

  wishLoading: {},

  setWishLoading: (id: string, value: boolean) =>
    set((state) => ({
      wishLoading: {
        ...state.wishLoading,
        [id]: value,
      },
    })),

  wishes: null,
  wishCount: 0,

  fetchWishList: async (reportError = false) => {
    const generation = ++wishlistGeneration;
    try {
      const result = await fetchWishlistItems({ page: 1, limit: 50 });
      if (generation !== wishlistGeneration) return;
      const data: WishlistItem[] = result.items ?? [];
      set({ wishes: data, wishCount: result.pagination?.total ?? data.length });
    } catch (err) {
      if (generation !== wishlistGeneration) return;
      if (reportError) throw err;
      if (
        err instanceof DashboardApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        set({ wishes: [], wishCount: 0 });
        return;
      }
      console.error("Fetch wishList error", err);
    }
  },

  addToWish: async (variantId: string) => {
    const owner = wishlistOwnerGeneration;
    const res = await addWishlistItem(variantId);
    if (owner !== wishlistOwnerGeneration) return res;
    wishlistGeneration += 1;
    wishlistRequest.invalidate();
    await get().fetchWishList();
    return res;
  },

  removeFromWishList: async (variantId: string) => {
    const owner = wishlistOwnerGeneration;
    const res = await removeWishlistItem(variantId);
    if (owner !== wishlistOwnerGeneration) return res;
    wishlistGeneration += 1;
    wishlistRequest.invalidate();
    await get().fetchWishList();
    return res;
  },

  clearWish: () => {
    wishlistOwnerGeneration += 1;
    wishlistGeneration += 1;
    wishlistRequest.invalidate();
    set({ wishes: [], wishCount: 0 });
  },
}));

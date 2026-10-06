import {
  addWishlistItem,
  fetchWishlistItems,
  removeWishlistItem,
  type WishlistItem,
} from "@/features/dashboard/customer/wishlist/api/wishlist";
import { DashboardApiError } from "@/lib/api/dashboard";
import type { WishState } from "@/types/wish";
import { create } from "zustand";

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

  fetchWishList: async () => {
    try {
      const result = await fetchWishlistItems({ page: 1, limit: 50 });
      const data: WishlistItem[] = result.items ?? [];
      set({ wishes: data, wishCount: result.pagination?.total ?? data.length });
    } catch (err) {
      if (err instanceof DashboardApiError && err.status === 401) {
        set({ wishes: [], wishCount: 0 });
        return;
      }
      console.error("Fetch wishList error", err);
      set({ wishes: [], wishCount: 0 });
    }
  },

  addToWish: async (variantId: string) => {
    const res = await addWishlistItem(variantId);
    await get().fetchWishList();
    return res;
  },

  removeFromWishList: async (variantId: string) => {
    const res = await removeWishlistItem(variantId);
    await get().fetchWishList();
    return res;
  },

  clearWish: () => {
    set({ wishes: [], wishCount: 0 });
  },
}));

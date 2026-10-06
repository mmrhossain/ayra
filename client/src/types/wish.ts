import type { WishlistItem } from "@/features/dashboard/customer/wishlist/types";

export type WishItem = WishlistItem;

export interface WishState {
  wishLoading: Record<string, boolean>;
  setWishLoading: (id: string, loading: boolean) => void;

  wishListLoading: boolean;
  setWishListLoading: (value: boolean) => void;

  wishes: WishlistItem[] | null;
  wishCount: number;

  fetchWishList: () => Promise<void>;
  addToWish: (variantId: string) => Promise<{ message: string }>;
  removeFromWishList: (variantId: string) => Promise<{ message: string }>;
  clearWish: () => void;
}

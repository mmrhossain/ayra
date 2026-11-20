import type { WishlistItem } from "./models";

export type {
  Envelope,
  WishlistItem,
  WishlistListResult,
  WishlistPagination,
  WishlistVariant,
  WishlistVariantImage,
} from "./models";

export type WishItem = WishlistItem;

export type WishState = {
  wishLoading: Record<string, boolean>;
  setWishLoading: (id: string, loading: boolean) => void;
  wishListLoading: boolean;
  setWishListLoading: (value: boolean) => void;
  wishes: WishlistItem[] | null;
  wishCount: number;
  fetchWishList: (reportError?: boolean) => Promise<void>;
  addToWish: (variantId: string) => Promise<{ message: string }>;
  removeFromWishList: (variantId: string) => Promise<{ message: string }>;
  clearWish: () => void;
};

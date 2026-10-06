import type { WishlistListResult } from "./models";

export type {
  Envelope,
  WishlistItem,
  WishlistListResult,
  WishlistPagination,
  WishlistVariant,
  WishlistVariantImage,
} from "./models";

export type WishlistGridProps = {
  initialData: WishlistListResult;
};

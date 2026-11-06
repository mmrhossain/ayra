import { DashboardApiError } from "@/lib/api/dashboard";
import type { WishlistItem } from "@/features/dashboard/customer/wishlist/types";

export function toWishlistErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) {
    if (err.status === 401) return "Please sign in to manage your wishlist";
    if (err.status === 403) {
      return err.message || "Staff accounts cannot shop. Sign in with a customer account.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function wishlistItemName(item: WishlistItem): string {
  return item.variant?.product?.name || "Product";
}

export function wishlistItemSlug(item: WishlistItem): string | null {
  return item.variant?.product?.slug || null;
}

export function wishlistItemPrice(item: WishlistItem): number | null {
  const n = Number(item.variant?.price);
  return Number.isFinite(n) ? n : null;
}

function firstValidImageUrl(images?: Array<{ imageUrl?: string; isPrimary?: boolean }>): string | null {
  const primary = images?.find((img) => img.isPrimary)?.imageUrl;
  const fallback = images?.[0]?.imageUrl;
  const url = primary || fallback;
  if (
    url &&
    (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))
  ) {
    return url;
  }
  return null;
}

export function wishlistItemImage(item: WishlistItem): string {
  return (
    firstValidImageUrl(item.variant?.product?.images) ||
    "https://placehold.jp/400x400.png"
  );
}

export function wishlistItemInStock(item: WishlistItem): boolean | null {
  if (!item.variant) return false;
  if (item.variant.availableStock == null) return null;
  return Number(item.variant.availableStock) > 0;
}

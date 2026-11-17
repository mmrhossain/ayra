import { createSharedRequest } from "@/lib/shared-request";
import { dashboardApi } from "@/lib/api/dashboard";
import type {
  Envelope,
  WishlistListResult,
} from "@/features/dashboard/customer/wishlist/types";

export type {
  Envelope,
  WishlistItem,
  WishlistListResult,
  WishlistPagination,
  WishlistVariant,
  WishlistVariantImage,
} from "@/features/dashboard/customer/wishlist/types";

export {
  toWishlistErrorMessage,
  wishlistItemName,
  wishlistItemSlug,
  wishlistItemPrice,
  wishlistItemImage,
  wishlistItemInStock,
} from "@/features/dashboard/customer/wishlist/utils";

const noStore = { cache: "no-store" as const };

async function loadWishlistItems(
  params: { page?: number; limit?: number } = {},
): Promise<WishlistListResult> {
  const res = await dashboardApi.get<Envelope<WishlistListResult>>(
    "/wishlist/items",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
      },
    },
  );
  return {
    items: res.data?.items ?? [],
    pagination: res.data?.pagination ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      total: 0,
      totalPages: 0,
    },
  };
}

export const wishlistRequest = createSharedRequest(() => loadWishlistItems({ page: 1, limit: 50 }));

export function fetchWishlistItems(params: { page?: number; limit?: number } = {}) {
  return (params.page ?? 1) === 1 && (params.limit ?? 50) === 50
    ? wishlistRequest.read()
    : loadWishlistItems(params);
}

export async function addWishlistItem(
  variantId: string,
): Promise<{ message: string }> {
  const res = await dashboardApi.post<Envelope<unknown>>("/wishlist/items", {
    body: { variantId },
  });
  wishlistRequest.invalidate();
  return { message: res.message || "Item added to wishlist" };
}

export async function removeWishlistItem(
  variantId: string,
): Promise<{ message: string }> {
  const res = await dashboardApi.delete<Envelope<unknown>>(
    `/wishlist/items/${variantId}`,
  );
  wishlistRequest.invalidate();
  return { message: res.message || "Item removed from wishlist" };
}

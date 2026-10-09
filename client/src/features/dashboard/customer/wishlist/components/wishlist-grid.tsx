"use client";

import EmptyState from "@/components/shared/EmptyState";
import { addCartItem, toCartErrorMessage } from "@/features/cart/api";
import { useWishlist } from "@/features/dashboard/customer/wishlist/hooks/use-wishlist";
import { useRemoveWishlistMutation } from "@/features/dashboard/customer/wishlist/hooks/use-wishlist-mutations";
import type {
  WishlistGridProps,
  WishlistItem,
} from "@/features/dashboard/customer/wishlist/types";
import {
  toWishlistErrorMessage,
  wishlistItemImage,
  wishlistItemInStock,
  wishlistItemName,
  wishlistItemPrice,
  wishlistItemSlug,
} from "@/features/dashboard/customer/wishlist/utils";
import WishListSkeleton from "@/skeleton/WishListSkeleton";
import { useCartStore } from "@/stores/useCartStore";
import {
  DeleteAlert,
  errorToast,
  formatPrice,
  SuccessAlert,
  successToast,
} from "@/helpers";
import { ShoppingCart, Trash2 } from "lucide-react";
import StoreImage from "@/components/shared/store-image";
import Link from "next/link";
import { useState } from "react";

export function WishlistGrid({ initialData }: WishlistGridProps) {
  const { query, items, pagination } = useWishlist({ initialData });
  const removeMutation = useRemoveWishlistMutation();
  const [movingId, setMovingId] = useState<string | null>(null);

  const loading = query.isFetching && items.length === 0;
  const wishCount = pagination.total;

  const handleWishRemove = async (variantId: string) => {
    try {
      const confirmed = await DeleteAlert();
      if (!confirmed) return;

      const result = await removeMutation.mutateAsync(variantId);
      if (result?.message) {
        await SuccessAlert(result.message);
      }
    } catch (err: unknown) {
      errorToast(toWishlistErrorMessage(err));
      console.error(err);
    }
  };

  const handleMoveToCart = async (item: WishlistItem): Promise<void> => {
    if (!item.variantId) {
      errorToast("Product not found");
      return;
    }
    const inStock = wishlistItemInStock(item);
    if (inStock === false) {
      errorToast("Out of stock");
      return;
    }
    try {
      setMovingId(item.variantId);
      const result = await addCartItem(item.variantId, 1, {
        productName: wishlistItemName(item),
        productSlug: wishlistItemSlug(item),
        productImage: wishlistItemImage(item),
        sku: item.variant?.sku ?? undefined,
        unitPrice: wishlistItemPrice(item) ?? undefined,
      });
      await useCartStore.getState().fetchCart();
      await removeMutation.mutateAsync(item.variantId);
      successToast(result.message);
    } catch (err) {
      errorToast(toCartErrorMessage(err));
    } finally {
      setMovingId(null);
    }
  };

  if (loading) return <WishListSkeleton />;
  if (wishCount === 0) {
    return <EmptyState text="wishlist" title="আপনার wishlist খালি" />;
  }

  return (
    <section className="container pb-24 md:pb-0">
      <div className="">
        <div className="mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-slate-900 uppercase">
            Wishlist ({wishCount})
          </h2>

          <p className="text-dark-color text-sm">All your save items</p>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const name = wishlistItemName(item);
            const slug = wishlistItemSlug(item);
            const price = wishlistItemPrice(item);
            const inStock = wishlistItemInStock(item);
            const href = slug
              ? `/product-details/${slug}?from_source=wishlist`
              : "/shop";
            const isMoving = movingId === item.variantId;

            return (
              <div
                key={item.variantId || item.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleWishRemove(item.variantId)}
                    className="p-2 rounded-md border border-gray-200 hover:bg-gray-100 text-secondary transition"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="w-24 sm:w-28 lg:w-32 h-32 sm:h-40 relative overflow-hidden shrink-0">
                    <Link href={href}>
                      <StoreImage
                        src={wishlistItemImage(item)}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 96px, 128px"
                        className="object-contain"
                      />
                    </Link>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <Link href={href}>
                      <p className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                        {name}
                      </p>
                    </Link>
                    <p className="text-xs sm:text-sm text-secondary">
                      {price != null ? formatPrice(price) : ""}
                    </p>
                    {item.variant?.sku ? (
                      <p className="text-xs text-slate-400">
                        SKU: {item.variant.sku}
                      </p>
                    ) : null}
                    {inStock !== null ? (
                      <p
                        className={`text-xs font-semibold ${
                          inStock ? "text-emerald-600" : "text-danger"
                        }`}
                      >
                        {inStock ? "In stock" : "Out of stock"}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-end sm:w-40">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={!item.variantId || isMoving || inStock === false}
                    className="px-4 py-2.5 text-white text-xs sm:text-sm font-semibold transition w-full sm:w-auto flex items-center justify-center bg-primary hover:bg-btn-hover disabled:bg-danger disabled:cursor-not-allowed"
                  >
                    <span className="flex gap-2 items-center">
                      {inStock === false ? null : <ShoppingCart size={16} />}
                      {isMoving
                        ? "Moving..."
                        : inStock === false
                          ? "Out of stock"
                          : "Move to cart"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

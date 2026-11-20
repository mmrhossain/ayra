"use client";

import EmptyState from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import StoreImage from "@/components/shared/store-image";
import {
  productCardBody,
  productCardIconBtn,
  productCardImage,
  productCardMedia,
  productCardPricePlain,
  productCardShell,
  productCardTitle,
} from "@/features/catalog/components/product/product-card.styles";
import { useWishlist } from "@/features/dashboard/customer/wishlist/hooks/use-wishlist";
import { useRemoveWishlistMutation } from "@/features/dashboard/customer/wishlist/hooks/use-wishlist-mutations";
import WishListSkeleton from "@/features/dashboard/customer/wishlist/skeleton/WishListSkeleton";
import type {
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
import { formatPrice, successToast } from "@/helpers";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function WishlistGrid() {
  const { query, items, count: wishCount } = useWishlist();
  const removeMutation = useRemoveWishlistMutation();
  const [pendingRemove, setPendingRemove] = useState<WishlistItem | null>(null);


  const handleWishRemove = async () => {
    if (!pendingRemove?.variantId) return;
    try {
      const result = await removeMutation.mutateAsync(pendingRemove.variantId);
      setPendingRemove(null);
      successToast(result?.message ?? "Removed from wishlist");
    } catch (err: unknown) {
      // The mutation's onError already surfaces the message.
      console.error(err);
    }
  };

  if (!items && query.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="text-lg font-semibold">Could not load wishlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {toWishlistErrorMessage(query.error)}
        </p>
        <button type="button" className="mt-3 text-sm underline" onClick={() => void query.refetch()}>
          Try again
        </button>
      </div>
    );
  }
  if (!items) return <WishListSkeleton />;
  if (wishCount === 0) {
    return (
      <EmptyState
        className="min-h-[min(28rem,60svh)]"
        title={"আপনার wishlist খালি"}
        description="Discover our curated heritage collection and fill your wishlist with pieces you'll cherish forever."
        actionLabel="Continue Shopping"
        actionHref="/shop"
        footerText="Handcrafted with heritage"
      />
    );
  }

  return (
    <section className="min-w-0 pb-24 md:pb-0">
      <div className="mb-6">
        <h2 className="text-lg font-semibold uppercase text-foreground lg:text-xl">
          Wishlist ({wishCount})
        </h2>
        <p className="text-sm text-dark-color">All your saved items</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const name = wishlistItemName(item);
          const slug = wishlistItemSlug(item);
          const price = wishlistItemPrice(item);
          const inStock = wishlistItemInStock(item);
          const href = slug
            ? `/product-details/${slug}?from_source=wishlist`
            : "/shop";

          return (
            <article
              key={item.variantId || item.id}
              className={`${productCardShell} min-w-0`}
            >
              <div className={productCardMedia}>
                <Link href={href} className="relative block h-full w-full">
                  <StoreImage
                    src={wishlistItemImage(item)}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className={productCardImage}
                  />
                </Link>
                <div className="absolute top-2 right-2 z-[5] sm:top-3 sm:right-3">
                  <button
                    type="button"
                    onClick={() => setPendingRemove(item)}
                    className={productCardIconBtn({ tone: "default" })}
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={productCardBody}>
                <h2 className={productCardTitle}>
                  <Link href={href}>{name}</Link>
                </h2>
                <p className={productCardPricePlain}>
                  {price != null ? formatPrice(price) : "—"}
                </p>
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
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        title="Remove from wishlist"
        description={
          pendingRemove
            ? `Remove ${wishlistItemName(pendingRemove)} from your wishlist?`
            : undefined
        }
        confirmLabel="Remove"
        pendingLabel="Removing..."
        pending={removeMutation.isPending}
        destructive
        onConfirm={() => void handleWishRemove()}
      />
    </section>
  );
}

"use client";

import { ProductListItem } from "@/features/catalog/api";
import {
  productCardBadge,
  productCardBody,
  productCardCompare,
  productCardIconBtn,
  productCardImage,
  productCardMedia,
  productCardPrice,
  productCardPricePlain,
  productCardShell,
  productCardTitle,
} from "@/features/catalog/components/product/product-card.styles";
import { productCardPricing } from "@/features/catalog/lib/product-card-pricing";
import { formatPrice } from "@/helpers";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";

import StoreImage from "@/components/shared/store-image";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import Link from "@/components/shared/intent-link";

function imageSrc(item: ProductListItem): string {
  const url = item?.images?.[0]?.imageUrl;
  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))) {
    return url;
  }
  return "https://placehold.jp/400x400.png";
}

export default function ProductCard({
  product,
  eagerImage = false,
}: {
  product: ProductListItem;
  eagerImage?: boolean;
}) {
  const { variantId, price, compareAt, discountPct } = productCardPricing(product);
  const { inWish, busy: wishBusy, toggleWishlist } = useWishlistToggle(variantId);
  const hasDiscount = price !== null && compareAt !== null;
  const href = `/product-details/${product?.slug}`;

  return (
    <div className={productCardShell}>
      <Link href={href} className="relative block h-full w-full">
        <div className={productCardMedia}>
          <StoreImage
            src={imageSrc(product)}
            alt={product?.name ?? "Product image"}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            loading={eagerImage ? "eager" : "lazy"}
            fetchPriority={eagerImage ? "high" : "auto"}
            className={productCardImage}
          />
          <div className="absolute top-2 right-2 z-[5] flex flex-col items-end gap-1.5 sm:top-3 sm:right-3 sm:gap-2">
            {hasDiscount && (
              <span className={productCardBadge({ tone: "sale" })}>{discountPct}% Off</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleWishlist();
              }}
              disabled={wishBusy || !variantId}
              aria-busy={wishBusy}
              className={cn(
                productCardIconBtn({ tone: inWish ? "active" : "default" }),
                "flex h-10 w-10 min-h-10 min-w-10 items-center justify-center p-0 disabled:opacity-50 sm:h-11 sm:w-11 sm:min-h-11 sm:min-w-11"
              )}
              aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={inWish}
            >
              {wishBusy ? (
                <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent sm:size-[18px]" />
              ) : (
                <Heart
                  size={16}
                  className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                  fill={inWish ? "currentColor" : "none"}
                />
              )}
            </button>
          </div>
        </div>
        <div className={productCardBody}>
          <h2 className={productCardTitle}>{product?.name}</h2>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {hasDiscount ? (
              <>
                <span className={productCardPrice}>{formatPrice(price)}</span>
                <span className={productCardCompare}>{formatPrice(compareAt)}</span>
              </>
            ) : (
              <span className={productCardPricePlain}>
                {price != null ? formatPrice(price) : "—"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

"use client";

import { ProductListItem, productPrice } from "@/features/catalog/api";
import {
  productCardBadge,
  productCardBody,
  productCardCompare,
  productCardCta,
  productCardIconBtn,
  productCardImage,
  productCardMedia,
  productCardPrice,
  productCardPricePlain,
  productCardShell,
  productCardTitle,
} from "@/features/catalog/components/product/product-card.styles";
import { formatPrice } from "@/helpers";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";

import StoreImage from "@/components/shared/store-image";
import { cn } from "@/lib/utils";
import { Rating } from "@smastrom/react-rating";
import { Heart } from "lucide-react";
import Link from "next/link";

function imageSrc(item: ProductListItem): string {
  const url = item?.images?.[0]?.imageUrl;
  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))) {
    return url;
  }
  return "https://placehold.jp/400x400.png";
}

export default function ProductCard({ product }: { product: ProductListItem }) {
  const defaultVariantId =
    product?.variants?.find((v) => v?.id)?.id ?? product?.variants?.[0]?.id ?? null;
  const { inWish, busy: wishBusy, toggleWishlist } = useWishlistToggle(defaultVariantId);
  const price = productPrice(product);
  const compare =
    product?.variants
      ?.map((v) => Number(v?.compareAtPrice))
      .filter((n) => Number.isFinite(n) && n > 0) ?? [];
  const compareAt = compare.length > 0 ? Math.min(...compare) : null;
  const hasDiscount = price != null && compareAt != null && compareAt > price;
  const discountPct = hasDiscount ? Math.floor((1 - price / compareAt) * 100) : 0;
  const href = `/product-details/${product?.slug}`;

  return (
    <div className={productCardShell}>
      <div className={productCardMedia}>
        <Link href={href} className="relative block h-full w-full">
          <StoreImage
            src={imageSrc(product)}
            alt={product?.name ?? "Product image"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={productCardImage}
          />
        </Link>
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
            disabled={wishBusy || !defaultVariantId}
            className={cn(
              productCardIconBtn({ tone: inWish ? "active" : "default" }),
              "disabled:opacity-50"
            )}
            aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={inWish}
          >
            <Heart size={16} fill={inWish ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className={productCardBody}>
        <h2 className={productCardTitle}>
          <Link href={href}>{product?.name}</Link>
        </h2>
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
        <div className="pb-2">
          <Rating value={Number(product?.averageRating) || 0} readOnly style={{ maxWidth: 64 }} />
        </div>
        <Link href={href} className={productCardCta()}>
          View
        </Link>
      </div>
    </div>
  );
}

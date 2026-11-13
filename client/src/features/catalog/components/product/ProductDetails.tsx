"use client";

import PageBreadcrumb from "@/components/shared/page-breadcrumb";
import QuantityStepper from "@/components/shared/quantity-stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StickyAddToCart from "@/features/cart/components/StickyAddToCart";
import ProductGallery from "@/features/catalog/components/product/ProductGallery";
import { useAddToCart } from "@/features/catalog/hooks/use-add-to-cart";
import { useProductSelection } from "@/features/catalog/hooks/use-product-selection";
import type { ProductDetail } from "@/features/catalog/types";
import { groupKind, parseColor } from "@/features/catalog/utils/color";
import { errorToast, successToast } from "@/helpers/index";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Heart, Share2 } from "lucide-react";
import React, { useRef } from "react";

function excerptFromHtml(html: string | null | undefined, max = 220): string {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

const ProductDetails: React.FC<{ product: ProductDetail }> = ({ product }) => {
  const {
    attributeGroups,
    quantity,
    setQuantity,
    selectedValues,
    setAttributeValue,
    isComplete,
    selected,
    active,
    selectedId,
    price,
    compareAt,
    hasDiscount,
    discountPct,
    stock,
    canAddToCart,
    galleryImages,
  } = useProductSelection(product);
  const { cartBusy, handleAddToCart: addToCart } = useAddToCart();
  const ctaRef = useRef<HTMLDivElement>(null);
  const { inWish, busy: wishBusy, toggleWishlist } = useWishlistToggle(selectedId);
  const hasAttributes = attributeGroups.length > 0;
  const sku = selected?.sku || product.sku || "";
  const brandName = product.brand?.name;
  const descriptionExcerpt = excerptFromHtml(product.description);

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // User dismissed the native share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      successToast("Link copied to clipboard");
    } catch {
      errorToast("Could not copy link");
    }
  };

  const handleAddToCart = () =>
    addToCart({
      product,
      selected,
      isComplete,
      quantity,
      galleryImageUrl: galleryImages[0]?.imageUrl,
    });

  const buttonLabel = cartBusy
    ? "Processing..."
    : !isComplete
      ? "Select options"
      : !selected
        ? "Unavailable"
        : stock < 1
          ? "Out of stock"
          : "Add to Bag";

  const buttonDisabled = cartBusy || !canAddToCart;

  return (
    <>
      <div className="container z-0 mx-auto mt-4 min-w-0 max-w-6xl sm:mt-6 md:mt-8 xl:max-w-7xl">
        <PageBreadcrumb
          className="mb-5 hidden sm:mb-6 sm:flex md:mb-8"
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(product.category?.name
              ? [
                  {
                    label: product.category.name,
                    href: `/shop?category=${encodeURIComponent(product.category.slug)}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20">
          <div className="min-w-0">
            <ProductGallery images={galleryImages} />
          </div>

          <div className="flex min-w-0 flex-col md:min-h-[480px]">
            <h1 className="text-2xl leading-tight font-semibold break-words text-foreground lg:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2 sm:mt-4 sm:min-h-9 sm:gap-3">
              {active && price > 0 ? (
                <>
                  <span className="text-lg font-normal tabular-nums tracking-tight text-foreground">
                    {formatPrice(price)}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-medium tabular-nums text-light-color2 line-through sm:text-xl md:text-2xl",
                      !hasDiscount && "invisible"
                    )}
                    aria-hidden={!hasDiscount}
                  >
                    {formatPrice(hasDiscount ? compareAt : price)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger sm:px-3 sm:text-sm",
                      !hasDiscount && "invisible"
                    )}
                    aria-hidden={!hasDiscount}
                  >
                    -{hasDiscount ? discountPct : 0}%
                  </span>
                </>
              ) : (
                <span className="text-lg font-normal tabular-nums text-foreground">—</span>
              )}
            </div>

            <dl className="mt-4 grid min-h-[3.25rem] grid-cols-2 gap-x-4 gap-y-2 text-sm sm:mt-5">
              <div>
                <dt className="text-xs uppercase tracking-wide text-sky-color">SKU</dt>
                <dd className="mt-0.5 min-h-5 font-medium text-foreground">{sku || "—"}</dd>
              </div>
              {brandName ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-sky-color">Brand</dt>
                  <dd className="mt-0.5 min-h-5 font-medium text-foreground">{brandName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-wide text-sky-color">Availability</dt>
                <dd
                  className={cn(
                    "mt-0.5 min-h-5 font-medium",
                    stock > 0 ? "text-foreground" : "text-danger"
                  )}
                >
                  {stock > 0 ? "In stock" : "Out of stock"}
                </dd>
              </div>
            </dl>

            {!hasAttributes && descriptionExcerpt ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-sky-color sm:mt-5 sm:text-base">
                {descriptionExcerpt}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border-color pt-4 sm:mt-6 sm:grid-cols-2 sm:gap-4 sm:pt-5 lg:flex lg:items-end lg:gap-4">
              <div className="min-w-0 w-full sm:w-[160px] sm:shrink-0">
                <span className="mb-2 block h-5 text-sm font-semibold text-foreground">Quantity</span>
                <QuantityStepper
                  value={quantity}
                  onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                  onIncrease={() => setQuantity((q) => Math.min(Math.max(stock || 1, 1), q + 1))}
                  decreaseDisabled={quantity <= 1}
                  className="h-12 w-full min-h-12 rounded-none border border-border-color bg-background sm:h-[52px] sm:min-h-[52px] md:h-[52px] lg:min-w-0"
                />
              </div>

              {attributeGroups.map((group) => (
                <div key={group.attributeId} className="min-w-0 lg:flex-1">
                  <label
                    htmlFor={`product-attribute-${group.attributeId}`}
                    className="mb-2 block h-5 text-sm font-semibold text-foreground"
                  >
                    {group.name}
                  </label>
                  <Select
                    value={selectedValues[group.attributeId] ?? ""}
                    onValueChange={(value) => setAttributeValue(group.attributeId, value)}
                  >
                    <SelectTrigger
                      id={`product-attribute-${group.attributeId}`}
                      className="h-12 min-h-12 w-full overflow-hidden rounded-none border-border-color bg-background text-base text-foreground shadow-none *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate sm:h-[52px] sm:min-h-[52px]"
                    >
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                      {group.values.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="min-h-11">
                          <span className="flex min-h-5 items-center gap-2">
                            {groupKind(group.name) === "color" ? (
                              <span
                                className="inline-block size-4 shrink-0 rounded-full border border-black/10"
                                style={{
                                  backgroundColor: item.color ?? parseColor(item.value),
                                }}
                              />
                            ) : null}
                            <span className="truncate">{item.value}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div
              ref={ctaRef}
              className="mt-4 flex w-full min-w-0 items-stretch gap-2.5 sm:mt-5 sm:gap-3"
            >
              <button
                type="button"
                onClick={() => void handleAddToCart()}
                disabled={buttonDisabled}
                className={cn(
                  "h-12 min-h-12 min-w-0 flex-1 cursor-pointer border border-ink px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-all active:scale-[0.99] sm:h-[52px] sm:min-h-[52px] sm:text-base",
                  cartBusy
                    ? "cursor-not-allowed border-light-color2 bg-light-color2"
                    : buttonDisabled
                      ? "cursor-not-allowed border-danger bg-danger"
                      : "bg-ink hover:bg-primary"
                )}
              >
                {buttonLabel}
              </button>

               <button
                 type="button"
                 onClick={() => void toggleWishlist()}
                 disabled={!selectedId || wishBusy || !selected}
                 aria-pressed={inWish}
                 aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
                 title={inWish ? "Remove from wishlist" : "Add to wishlist"}
                 className="flex h-12 min-h-12 w-12 shrink-0 cursor-pointer items-center justify-center border border-ink text-foreground transition-colors hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-40 sm:h-[52px] sm:min-h-[52px] sm:w-[52px]"
               >
                <Heart size={20} className={cn(inWish && "fill-current")} />
              </button>

               <button
                 type="button"
                 onClick={() => void handleShare()}
                 aria-label="Share product"
                 title="Share product"
                 className="flex h-12 min-h-12 w-12 shrink-0 cursor-pointer items-center justify-center border border-ink text-foreground transition-colors hover:bg-bg-primary sm:h-[52px] sm:min-h-[52px] sm:w-[52px]"
               >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <StickyAddToCart
        productName={product.name || ""}
        price={hasDiscount ? compareAt : price}
        discountPrice={price}
        discount={hasDiscount ? Math.floor((1 - price / compareAt) * 100) : 0}
        isOutOfStock={!canAddToCart}
        isLoading={cartBusy}
        onAddToCart={() => void handleAddToCart()}
        ctaRef={ctaRef}
      />
    </>
  );
};

export default ProductDetails;

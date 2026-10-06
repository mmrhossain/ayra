"use client";

import PageBreadcrumb from "@/components/shared/page-breadcrumb";
import QuantityStepper from "@/components/shared/quantity-stepper";
import StickyAddToCart from "@/features/cart/components/StickyAddToCart";
import ProductGallery from "@/features/catalog/components/product/ProductGallery";
import { useAddToCart } from "@/features/catalog/hooks/use-add-to-cart";
import { useProductSelection } from "@/features/catalog/hooks/use-product-selection";
import type { ProductDetail } from "@/features/catalog/types";
import { groupKind, isLightColor, parseColor } from "@/features/catalog/utils/color";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Rating } from "@smastrom/react-rating";
import { Check } from "lucide-react";
import React, { useMemo, useRef } from "react";

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
  const ratingValue = Number(product.averageRating) || 0;
  const hasAttributes = attributeGroups.length > 0;
  const sku = selected?.sku || product.sku || "";
  const brandName = product.brand?.name;
  const categoryName = product.category?.name;
  const descriptionExcerpt = useMemo(
    () => excerptFromHtml(product.description),
    [product.description]
  );

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
          : "Add to Cart";

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
            <h1 className="text-xl font-black font-normal capitalize leading-[1.15] tracking-tight text-secondary sm:text-2xl md:text-3xl">
              {product.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
              <Rating value={ratingValue} readOnly style={{ maxWidth: 80 }} />
              <span className="text-xs font-medium text-sky-color sm:text-sm">
                {ratingValue > 0 ? ratingValue.toFixed(1) : "0"}
                {product.reviewCount ? ` / ${product.reviewCount}` : ""}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
              {active && price > 0 ? (
                <>
                  <span className="text-lg font-normal tracking-tight text-secondary">
                    {formatPrice(price)}
                  </span>
                  {hasDiscount ? (
                    <>
                      <span className="text-lg font-medium text-light-color2 line-through sm:text-xl md:text-2xl">
                        {formatPrice(compareAt)}
                      </span>
                      <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger sm:px-3 sm:text-sm">
                        -{discountPct}%
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="text-2xl font-bold text-secondary">—</span>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:mt-5">
              {sku ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-sky-color">SKU</dt>
                  <dd className="mt-0.5 font-medium text-secondary">{sku}</dd>
                </div>
              ) : null}
              {brandName ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-sky-color">Brand</dt>
                  <dd className="mt-0.5 font-medium text-secondary">{brandName}</dd>
                </div>
              ) : null}
              {categoryName ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-sky-color">Category</dt>
                  <dd className="mt-0.5 font-medium text-secondary">{categoryName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-wide text-sky-color">Availability</dt>
                <dd
                  className={cn("mt-0.5 font-medium", stock > 0 ? "text-secondary" : "text-danger")}
                >
                  {stock > 0 ? "In stock" : "Out of stock"}
                </dd>
              </div>
            </dl>

            {!hasAttributes && descriptionExcerpt ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-sky-color sm:mt-5 sm:text-[15px]">
                {descriptionExcerpt}
              </p>
            ) : null}

            {attributeGroups.map((group) => {
              const kind = groupKind(group.name);
              const selectedIdForGroup = selectedValues[group.attributeId];

              if (kind === "color") {
                return (
                  <div
                    key={group.attributeId}
                    className="mt-5 border-t border-border-color pt-4 sm:mt-6 sm:pt-5"
                  >
                    <p className="mb-3 text-sm text-sky-color sm:text-[15px]">Select Colors</p>
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      {group.values.map((item) => {
                        const color = parseColor(item.value);
                        const isSelected = selectedIdForGroup === item.id;
                        const light = isLightColor(color);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAttributeValue(group.attributeId, item.id)}
                            aria-label={item.value}
                            aria-pressed={isSelected}
                            title={item.value}
                            className={cn(
                              "relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-black/10 transition-transform sm:h-8 sm:w-8",
                              isSelected ? "ring-2 ring-offset-2 ring-secondary" : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          >
                            {isSelected ? (
                              <Check
                                size={10}
                                strokeWidth={3}
                                className={light ? "text-secondary" : "text-white"}
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={group.attributeId}
                  className="mt-5 border-t border-border-color pt-4 sm:mt-6 sm:pt-5"
                >
                  <p className="mb-3 text-sm text-sky-color sm:text-[15px]">
                    {kind === "size" ? "Choose Size" : group.name}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {group.values.map((item) => {
                      const isSelected = selectedIdForGroup === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAttributeValue(group.attributeId, item.id)}
                          aria-pressed={isSelected}
                          className={cn(
                            "min-h-8 min-w-[62px] cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:min-h-9 sm:px-5 sm:text-[15px]",
                            isSelected
                              ? "bg-secondary text-white"
                              : "bg-bg-primary text-sky-color hover:bg-border-color"
                          )}
                        >
                          {item.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div
              ref={ctaRef}
              className="mt-5 flex w-full min-w-0 items-center gap-3 border-t border-border-color pt-4 sm:mt-6 sm:gap-3.5 sm:pt-5 md:mt-auto md:gap-4"
            >
              <QuantityStepper
                value={quantity}
                onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                onIncrease={() => setQuantity((q) => Math.min(Math.max(stock || 1, 1), q + 1))}
                decreaseDisabled={quantity <= 1}
              />

              <button
                type="button"
                onClick={() => void handleAddToCart()}
                disabled={buttonDisabled}
                className={cn(
                  "h-11 min-w-0 flex-1 cursor-pointer rounded-sm px-5 text-sm font-medium text-white transition-all active:scale-[0.98] sm:h-12 sm:text-[15px] md:h-[42px] md:text-base",
                  cartBusy
                    ? "cursor-not-allowed bg-light-color2"
                    : buttonDisabled
                      ? "cursor-not-allowed bg-danger"
                      : "bg-secondary hover:bg-primary"
                )}
              >
                {buttonLabel}
              </button>
            </div>

            {selectedId ? (
              <button
                type="button"
                onClick={() => void toggleWishlist()}
                disabled={wishBusy || !selected}
                className="mt-3 self-start text-sm font-medium text-sky-color transition-colors hover:text-primary disabled:opacity-50"
                aria-pressed={inWish}
              >
                {inWish ? "Remove from wishlist" : "Add to wishlist"}
              </button>
            ) : null}
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

"use client";

import PageBreadcrumb from "@/components/shared/page-breadcrumb";
import QuantityStepper from "@/components/shared/quantity-stepper";
import StickyAddToCart from "@/features/cart/components/StickyAddToCart";
import ProductGallery from "@/features/catalog/components/product/ProductGallery";
import { productDetailsLayout } from "@/features/catalog/components/product/product-details-layout";
import { useAddToCart } from "@/features/catalog/hooks/use-add-to-cart";
import { useProductSelection } from "@/features/catalog/hooks/use-product-selection";
import type { ProductDetail } from "@/features/catalog/types";
import { groupKind, parseColor } from "@/features/catalog/utils/color";
import { errorToast, successToast } from "@/helpers/index";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { features } from "@/constants/features";
import { ChevronDown, Heart, Share2 } from "lucide-react";
import { Popover } from "radix-ui";
import React, { useRef, useState } from "react";

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
  const [selectionAttempted, setSelectionAttempted] = useState(false);
  const [openAttributeId, setOpenAttributeId] = useState<string | null>(null);
  const missingAttributes = attributeGroups.filter(group => !selectedValues[group.attributeId]);
  const sku = selected?.sku || product.sku || "";
  const brandName = product.brand?.name;

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

  const handleAddToCart = () => {
    setSelectionAttempted(true);
    if (missingAttributes.length) {
      const group = document.getElementById("product-attribute-" + missingAttributes[0].attributeId);
      group?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      setOpenAttributeId(missingAttributes[0].attributeId);
      group?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }
    return addToCart({
      product, selected, isComplete, quantity,
      galleryImageUrl: galleryImages[0]?.imageUrl,
    });
  };

  const buttonLabel = cartBusy
    ? "Processing..."
    : isComplete && !selected
      ? "Unavailable"
      : isComplete && stock < 1
        ? "Out of stock"
        : "Add to Bag";
  const buttonDisabled = cartBusy || (isComplete && !canAddToCart);

  return (
    <>
      <div className={productDetailsLayout.container}>
        <PageBreadcrumb
          className={productDetailsLayout.breadcrumb}
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

        <div className={productDetailsLayout.grid}>
          <div className="min-w-0">
            <ProductGallery images={galleryImages} />
          </div>

          <div className={productDetailsLayout.details}>
            <h1 className="text-2xl leading-tight font-semibold break-words text-foreground lg:text-3xl">
              {product.name}
            </h1>

            <div className="mt-2 flex min-h-8 flex-wrap items-center gap-2 sm:mt-3 sm:min-h-9 sm:gap-3">
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

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:mt-4">
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
                    !isComplete || stock > 0 ? "text-foreground" : "text-danger"
                  )}
                >
                  {!isComplete ? "Choose options" : !selected ? "Unavailable" : stock > 0 ? "In stock" : "Out of stock"}
                </dd>
              </div>
            </dl>

            <div className={productDetailsLayout.controls}>
              <div className={productDetailsLayout.quantity}>
                <span className="mb-2 block h-5 text-sm font-semibold text-foreground">Quantity</span>
                <QuantityStepper
                  value={quantity}
                  onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                  onIncrease={() => setQuantity((q) => Math.min(Math.max(stock || 1, 1), q + 1))}
                  decreaseDisabled={quantity <= 1}
                  increaseDisabled={!canAddToCart || quantity >= stock}
                  className="h-12 w-full min-h-12 rounded-none border border-border-color bg-background sm:h-[52px] sm:min-h-[52px] md:h-[52px] lg:min-w-0"
                />
              </div>

              {attributeGroups.map((group) => (
                <div key={group.attributeId} id={"product-attribute-" + group.attributeId} className="min-w-0 scroll-mt-24 lg:flex-1">
                  <span
                    id={`product-attribute-label-${group.attributeId}`}
                    className="mb-2 block h-5 text-sm font-semibold text-foreground"
                  >
                    {group.name}
                  </span>
                  <Popover.Root
                    open={openAttributeId === group.attributeId}
                    onOpenChange={open => setOpenAttributeId(current =>
                      open ? group.attributeId : current === group.attributeId ? null : current,
                    )}
                  >
                    <Popover.Trigger asChild>
                      <button
                        id={`product-attribute-trigger-${group.attributeId}`}
                        type="button"
                        aria-labelledby={`product-attribute-label-${group.attributeId} product-attribute-trigger-${group.attributeId}`}
                        data-invalid={selectionAttempted && !selectedValues[group.attributeId]}
                        aria-describedby={selectionAttempted && !selectedValues[group.attributeId] ? "product-attribute-error-" + group.attributeId : undefined}
                        className="flex h-12 w-full items-center justify-between gap-2 border border-border-color bg-background px-3 text-left text-base text-foreground data-[invalid=true]:border-danger sm:h-[52px]"
                      >
                        <span className="truncate">
                          {group.values.find(item => item.id === selectedValues[group.attributeId])?.value ?? "Choose an option"}
                        </span>
                        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        aria-labelledby={`product-attribute-label-${group.attributeId}`}
                        align="start"
                        sideOffset={4}
                        collisionPadding={12}
                        onCloseAutoFocus={event => event.preventDefault()}
                        onEscapeKeyDown={() => {
                          document.getElementById(`product-attribute-trigger-${group.attributeId}`)?.focus({ preventScroll: true });
                        }}
                        className="z-[60] max-h-[min(15rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] overflow-y-auto border border-border-color bg-background p-1 shadow-md"
                      >
                        <fieldset aria-labelledby={`product-attribute-label-${group.attributeId}`} className="min-w-0 space-y-1">
                          {group.values.map(item => (
                            <label key={item.id} className="relative flex min-h-11 cursor-pointer items-center gap-2 px-2 text-sm text-foreground has-[:checked]:bg-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 hover:bg-muted">
                              <input
                                type="radio"
                                name={`product-attribute-${group.attributeId}`}
                                value={item.id}
                                checked={selectedValues[group.attributeId] === item.id}
                                onChange={() => setAttributeValue(group.attributeId, item.id)}
                                className="sr-only"
                              />
                              {groupKind(group.name) === "color" ? (
                                <span
                                  aria-hidden="true"
                                  className="size-4 shrink-0 rounded-full border border-black/10"
                                  style={{ backgroundColor: item.color ?? parseColor(item.value) }}
                                />
                              ) : null}
                              <span className="break-words">{item.value}</span>
                            </label>
                          ))}
                        </fieldset>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                  {selectionAttempted && !selectedValues[group.attributeId] ? (
                    <p id={"product-attribute-error-" + group.attributeId} role="alert" className="mt-1 text-sm text-danger">
                      Please select {group.name.toLowerCase()}.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div
              ref={ctaRef}
              className={productDetailsLayout.actions}
            >
              <button
                type="button"
                onClick={() => void handleAddToCart()}
                disabled={buttonDisabled}
                aria-busy={cartBusy}
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
                 aria-busy={wishBusy}
                 aria-pressed={inWish}
                 aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
                 title={inWish ? "Remove from wishlist" : "Add to wishlist"}
                 className="flex h-12 min-h-12 w-12 shrink-0 cursor-pointer items-center justify-center border border-ink text-foreground transition-colors hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-40 sm:h-[52px] sm:min-h-[52px] sm:w-[52px]"
               >
                {wishBusy ? (
                  <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Heart size={20} className={cn(inWish && "fill-current")} />
                )}
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

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Store benefits">
              {features.slice(0, 2).map(({ id, title, description, icon: Icon }) => (
                <div key={id} className="flex min-w-0 items-start gap-2 border border-border-color p-2.5">
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold leading-tight text-foreground">{title}</p>
                    <p className="mt-1 break-words text-[11px] leading-snug text-sky-color">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StickyAddToCart
        productName={product.name || ""}
        price={hasDiscount ? compareAt : price}
        discountPrice={price}
        discount={hasDiscount ? Math.floor((1 - price / compareAt) * 100) : 0}
        disabled={buttonDisabled}
        buttonLabel={buttonLabel}
        isLoading={cartBusy}
        onAddToCart={() => void handleAddToCart()}
        ctaRef={ctaRef}
      />
    </>
  );
};

export default ProductDetails;

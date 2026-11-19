"use client";

import { resolveProductImage } from "@/features/cart/lib/product-image";
import { variantMetaFromSku } from "@/features/cart/lib/variant-meta";
import type { CustomerCartItem } from "@/features/checkout/api";
import { CheckoutSummaryRow } from "@/features/checkout/components/checkout-ui";
import OrderLineItem from "@/features/checkout/components/order-line-item";
import type { CheckoutPayload } from "@/features/checkout/types";
import { toShippingErrorMessage } from "@/features/shipping/shipping-api";
import { useCheckoutShipping } from "@/features/checkout/hooks/use-checkout-shipping";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { formatPrice } from "@/helpers";
import { cn } from "@/lib/utils";
import { formatPriceWithDecimals } from "@/lib/format";
import { locationStore } from "@/stores/location.store";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function variantLabel(item: CustomerCartItem): string | undefined {
  const sku = item.sku || item.variant?.sku;
  const attributes =
    item.variant?.attributes
      ?.map((entry) => {
        const attribute = entry.attributeValue;
        return attribute?.attribute?.name && attribute.value
          ? `${attribute.attribute.name}: ${attribute.value}`
          : null;
      })
      .filter((attribute): attribute is string => attribute !== null) ?? [];
  if (attributes.length === 0) {
    const meta = variantMetaFromSku(sku);
    if (meta.size) attributes.push(`Size: ${meta.size}`);
    if (meta.color) attributes.push(`Color: ${meta.color}`);
  }
  if (sku) attributes.push(`SKU: ${sku}`);
  return attributes.length > 0 ? attributes.join(" · ") : undefined;
}

const OrderReview = ({
  paymentMethod: _paymentMethod,
  className,
}: {
  paymentMethod: CheckoutPayload["paymentMethod"];
  className?: string;
}) => {
  void _paymentMethod;
  const { formState } = locationStore();
  const { checkout } = usePublicSettings();
  const { cartQuery, optionsQuery } = useCheckoutShipping(formState.district, formState.districtCode);
  const cart = cartQuery.data;
  const items = cart?.items ?? [];
  const subtotal = Number(cart?.subtotal ?? 0);
  const discountAmount = Number(cart?.discountAmount ?? 0);
  const vatAmount = Number(cart?.taxAmount ?? 0);
  const taxRates = cart?.taxRates ?? [];
  const discountPct = subtotal > 0 && discountAmount > 0 ? Math.round((discountAmount / subtotal) * 100) : 0;
  const cartStatus = cartQuery.isPending ? "loading" : cartQuery.isError ? "error" : items.length ? "success" : "empty";
  const cartError = cartQuery.error?.message;
  const selectedQuote = optionsQuery.data?.options.find(option => option.methodCode === formState.shippingMethodCode);
  const shippingAmount = cart?.freeShipping ? 0 : selectedQuote?.shippingAmount ?? 0;
  const payableAmount = Math.round((Number(cart?.grandTotal ?? 0) + shippingAmount) * 100) / 100;

  const shippingValue = !formState.district
    ? "Calculated at next step"
    : optionsQuery.isLoading
      ? "Calculating..."
      : optionsQuery.isError
        ? toShippingErrorMessage(optionsQuery.error)
        : selectedQuote
          ? selectedQuote.isFreeShipping || cart?.freeShipping
            ? "Free"
            : formatPrice(shippingAmount)
          : "Calculated at next step";

  const shippingMuted =
    !selectedQuote && (!formState.district || optionsQuery.isLoading || !optionsQuery.isError);

  return (
    <aside
      aria-busy={cartStatus === "loading"}
      className={cn("relative h-fit min-w-0 rounded-md border border-border bg-card px-4 py-5 sm:px-5 sm:py-6 lg:sticky lg:top-[calc(var(--header-height,120px)+1.5rem)] xl:px-6 xl:py-7", className)}
    >
      {cartStatus === "success" ? (
        <span className="absolute right-4 top-5 text-xs text-muted-foreground sm:right-5 sm:top-6 xl:right-6">
          ({items.length})
        </span>
      ) : null}

      <h2 className="pr-10 text-xs font-semibold uppercase tracking-[0.16em] text-foreground sm:tracking-[0.18em]">
        Your order
      </h2>

      {cartStatus === "loading" ? (
        <div role="status" aria-live="polite" className="mt-4 space-y-3">
          <span className="sr-only">Loading order summary</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : cartStatus === "error" ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
        >
          <p className="text-sm text-destructive">{cartError ?? "We couldn't load your cart."}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void cartQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : cartStatus === "empty" ? (
        <p className="mt-4 text-sm text-muted-foreground">Your cart is empty.</p>
      ) : (
        <>
          <div className="mt-2 divide-y divide-border">
            {items.map((item) => {
              const productName =
                item.productName || item.variant?.product?.name || "Unknown product";
              const unitPrice = Number(item.variant?.price ?? item.unitPrice ?? 0);
              const qty = Number(item.quantity ?? 0);
              const slug = item.productSlug || item.variant?.product?.slug;
              return (
                <OrderLineItem
                  key={item.id}
                  name={productName}
                  image={resolveProductImage(item)}
                  variantLabel={variantLabel(item)}
                  price={Number(item.subtotal ?? unitPrice * qty)}
                  changeHref={slug ? `/product-details/${slug}` : "/cart"}
                />
              );
            })}
          </div>

          <div className="mt-1 border-t border-border pt-3">
            <CheckoutSummaryRow label="Subtotal" value={formatPrice(Number(subtotal))} />
            {discountAmount > 0 ? (
              <CheckoutSummaryRow
                label={"Discount" + (discountPct ? " (-" + discountPct + "%)" : "")}
                value={"-" + formatPrice(discountAmount)}
              />
            ) : null}
            {checkout.taxEnabled ? (
              <CheckoutSummaryRow
                label={"Tax/VAT" + (taxRates.length ? " (" + taxRates.map(rate => rate + "%").join(", ") + ")" : "")}
                value={formatPriceWithDecimals(vatAmount)}
              />
            ) : null}
            <CheckoutSummaryRow label="Shipping Charge" value={shippingValue} muted={shippingMuted} />
            <div className="mt-3 border-t border-border">
              <CheckoutSummaryRow
                label="Grand Total"
                value={formatPrice(Number(payableAmount))}
                emphasize
              />
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default OrderReview;

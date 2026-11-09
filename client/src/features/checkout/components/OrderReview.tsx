"use client";

import { resolveProductImage } from "@/features/cart/lib/product-image";
import { variantMetaFromSku } from "@/features/cart/lib/variant-meta";
import { cartCouponCode, fetchMyCart, type CustomerCartItem } from "@/features/checkout/api";
import { CheckoutSummaryRow } from "@/features/checkout/components/checkout-ui";
import OrderLineItem from "@/features/checkout/components/order-line-item";
import type { CheckoutPayload } from "@/features/checkout/types";
import { fetchShippingOptions, toShippingErrorMessage } from "@/features/shipping/shipping-api";
import { formatPrice } from "@/helpers";
import { locationStore } from "@/stores/location.store";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function variantLabel(item: CustomerCartItem): string | undefined {
  const sku = item.sku || item.variant?.sku;
  const meta = variantMetaFromSku(sku);
  if (meta.color && meta.size) return `${meta.color}/${meta.size}`;
  if (meta.color) return meta.color;
  if (meta.size) return meta.size;
  return sku || undefined;
}

const OrderReview = ({
  paymentMethod: _paymentMethod,
}: {
  paymentMethod: CheckoutPayload["paymentMethod"];
}) => {
  void _paymentMethod;
  const { formState } = locationStore();
  const [items, setItems] = useState<CustomerCartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [cartGrandTotal, setCartGrandTotal] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [cartStatus, setCartStatus] = useState<"loading" | "success" | "empty" | "error">(
    "loading"
  );
  const [cartError, setCartError] = useState<string | null>(null);
  const requestId = useRef(0);
  const shippingSubtotal = Math.max(0, subtotal - discountAmount);
  const taxIncluded =
    Number(vatAmount) > 0 && Math.abs(Number(cartGrandTotal) - Number(shippingSubtotal)) < 0.01;

  const optionsQuery = useQuery({
    queryKey: [
      "checkout-shipping-options",
      formState.district,
      formState.districtCode,
      shippingSubtotal,
    ],
    queryFn: () =>
      fetchShippingOptions({
        district: formState.district,
        districtCode: formState.districtCode,
        subtotal: shippingSubtotal,
      }),
    enabled: cartStatus === "success" && Boolean(formState.district || formState.districtCode),
    staleTime: 15_000,
  });

  const selectedQuote = optionsQuery.data?.options.find(
    (option) => option.methodCode === formState.shippingMethodCode
  );
  const shippingAmount = selectedQuote?.shippingAmount ?? 0;
  // Cart grandTotal is authoritative for whether tax is already included in
  // the item prices; adding tax again here would overstate the total.
  const payableAmount = useMemo(
    () => Number(cartGrandTotal) + shippingAmount,
    [cartGrandTotal, shippingAmount]
  );

  const loadCart = useCallback(async () => {
    // Yield before updating state so the initial effect run does not trigger a
    // synchronous cascading render.
    await Promise.resolve();
    const id = ++requestId.current;
    setCartStatus("loading");
    setCartError(null);

    try {
      const cart = await fetchMyCart();
      if (id !== requestId.current) return;

      const nextItems = cart.items ?? [];
      setItems(nextItems);
      setSubtotal(Number(cart.subtotal ?? 0));
      setDiscountAmount(Number(cart.discountAmount ?? 0));
      setVatAmount(Number(cart.taxAmount ?? 0));
      setCartGrandTotal(Number(cart.grandTotal ?? cart.subtotal ?? 0));
      setCouponCode(cartCouponCode(cart));
      setCartStatus(nextItems.length === 0 ? "empty" : "success");
    } catch (err) {
      if (id !== requestId.current) return;
      console.error(err);
      setCartStatus("error");
      setCartError(
        err instanceof Error && err.message ? err.message : "We couldn't load your cart."
      );
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => void loadCart(), 0);
    return () => {
      clearTimeout(task);
      requestId.current += 1;
    };
  }, [loadCart]);

  const shippingValue = !formState.district
    ? "Calculated at next step"
    : optionsQuery.isLoading
      ? "Calculating..."
      : optionsQuery.isError
        ? toShippingErrorMessage(optionsQuery.error)
        : selectedQuote
          ? selectedQuote.isFreeShipping
            ? "Free"
            : formatPrice(shippingAmount)
          : "Calculated at next step";

  const shippingMuted =
    !selectedQuote && (!formState.district || optionsQuery.isLoading || !optionsQuery.isError);

  return (
    <aside
      aria-busy={cartStatus === "loading"}
      className="relative h-fit min-w-0 rounded-md border border-border bg-card px-4 py-5 sm:px-5 sm:py-6 lg:sticky lg:top-[calc(var(--header-height,120px)+1.5rem)] xl:px-6 xl:py-7"
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
            onClick={() => void loadCart()}
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
                  quantity={qty}
                  price={Number(item.subtotal ?? unitPrice * qty)}
                  changeHref={slug ? `/product-details/${slug}` : "/cart"}
                />
              );
            })}
          </div>

          <div className="mt-1 border-t border-border pt-3">
            <CheckoutSummaryRow label="Subtotal" value={formatPrice(Number(subtotal))} />
            {couponCode ? <CheckoutSummaryRow label="Coupon" value={couponCode} /> : null}
            {Number(discountAmount) > 0 ? (
              <CheckoutSummaryRow label="Discount" value={formatPrice(Number(discountAmount))} />
            ) : null}
            {Number(vatAmount) > 0 ? (
              <CheckoutSummaryRow
                label={taxIncluded ? "Tax (included in prices)" : "Tax"}
                value={formatPrice(Number(vatAmount))}
              />
            ) : null}
            <CheckoutSummaryRow label="Shipping" value={shippingValue} muted={shippingMuted} />
            <CheckoutSummaryRow
              label="Total"
              value={formatPrice(Number(payableAmount))}
              emphasize
            />
          </div>
        </>
      )}
    </aside>
  );
};

export default OrderReview;

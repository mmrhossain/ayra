"use client";

import { CheckoutSummaryRow } from "@/features/checkout/components/checkout-ui";
import OrderLineItem from "@/features/checkout/components/order-line-item";
import {
  cartCouponCode,
  fetchMyCart,
  type CustomerCartItem,
} from "@/features/checkout/api";
import { variantMetaFromSku } from "@/features/cart/lib/variant-meta";
import type { CheckoutPayload } from "@/features/checkout/types";
import {
  fetchShippingOptions,
  toShippingErrorMessage,
} from "@/features/shipping/shipping-api";
import { formatPrice } from "@/helpers";
import { locationStore } from "@/stores/location.store";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

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
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const optionsQuery = useQuery({
    queryKey: ["checkout-shipping-options", formState.district, subtotal],
    queryFn: () =>
      fetchShippingOptions({
        district: formState.district,
        subtotal,
      }),
    enabled: Boolean(formState.district),
    staleTime: 15_000,
  });

  const selectedQuote = optionsQuery.data?.options.find(
    (option) => option.methodCode === formState.shippingMethodCode,
  );
  const shippingAmount = selectedQuote?.shippingAmount ?? 0;
  const payableAmount = useMemo(
    () =>
      Number(subtotal) -
      Number(discountAmount) +
      Number(vatAmount) +
      shippingAmount,
    [subtotal, discountAmount, vatAmount, shippingAmount],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cart = await fetchMyCart();
        if (cancelled) return;
        setItems(cart.items ?? []);
        setSubtotal(Number(cart.subtotal ?? 0));
        setDiscountAmount(Number(cart.discountAmount ?? 0));
        setVatAmount(Number(cart.taxAmount ?? 0));
        setCouponCode(cartCouponCode(cart));
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    !selectedQuote &&
    (!formState.district || optionsQuery.isLoading || !optionsQuery.isError);

  return (
    <aside className="relative h-fit border border-[#ececec] bg-white px-4 py-5 sm:px-5 sm:py-6 lg:sticky lg:top-24 xl:px-6 xl:py-7">
      <span className="absolute right-4 top-5 text-[11px] text-neutral-400 sm:right-5 sm:top-6 xl:right-6">
        ({items.length})
      </span>

      <h2 className="pr-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary sm:text-xs sm:tracking-[0.18em]">
        Your order
      </h2>

      <div className="mt-2 divide-y divide-[#f0f0f0]">
        {items.map((item) => {
          const productName =
            item.productName ||
            item.variant?.product?.name ||
            "Unknown product";
          const unitPrice = Number(item.variant?.price ?? item.unitPrice ?? 0);
          const qty = Number(item.quantity ?? 0);
          const slug = item.productSlug || item.variant?.product?.slug;
          return (
            <OrderLineItem
              key={item.id}
              name={productName}
              image={item.productImage}
              variantLabel={variantLabel(item)}
              quantity={qty}
              price={Number(item.subtotal ?? unitPrice * qty)}
              changeHref={slug ? `/product-details/${slug}` : "/cart"}
            />
          );
        })}
      </div>

      <div className="mt-1 border-t border-[#f0f0f0] pt-3">
        <CheckoutSummaryRow
          label="Subtotal"
          value={formatPrice(Number(subtotal))}
        />
        {couponCode ? (
          <CheckoutSummaryRow label="Coupon" value={couponCode} />
        ) : null}
        {Number(discountAmount) > 0 ? (
          <CheckoutSummaryRow
            label="Discount"
            value={formatPrice(Number(discountAmount))}
          />
        ) : null}
        {Number(vatAmount) > 0 ? (
          <CheckoutSummaryRow
            label="Vat"
            value={formatPrice(Number(vatAmount))}
          />
        ) : null}
        <CheckoutSummaryRow
          label="Shipping"
          value={shippingValue}
          muted={shippingMuted}
        />
        <CheckoutSummaryRow
          label="Total"
          value={formatPrice(Number(payableAmount))}
          emphasize
        />
      </div>
    </aside>
  );
};

export default OrderReview;

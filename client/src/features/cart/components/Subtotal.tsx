"use client";

import { fetchAvailableCartCoupons, toCartErrorMessage } from "@/features/cart/api";
import { errorToast, formatPrice, successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import { formatPriceWithDecimals } from "@/lib/format";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { useCartStore } from "@/stores/useCartStore";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronRight, LoaderCircle, Tag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Subtotal = () => {
  const { checkout } = usePublicSettings();
  const { cart, totalAmount, discountAmount, vatAmount, taxRates, payableAmount, couponCode, applyCoupon, removeCoupon } =
    useCartStore();
  const { data } = authClient.useSession();
  const isLogin = Boolean(data?.user);
  const router = useRouter();
  const [pendingCouponCode, setPendingCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const availableCoupons = useQuery({
    queryKey: ["available-cart-coupons", data?.user?.id, cart?.map(item => [item.variantId, item.quantity, item.unitPrice])],
    queryFn: ({ signal }) => fetchAvailableCartCoupons(signal),
    enabled: isLogin && Boolean(cart?.length),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const couponCards = (availableCoupons.data ?? []).map(coupon => ({
    code: coupon.code,
    name: coupon.name,
    benefit: coupon.discountType === "FREE_SHIPPING" ? "Free shipping" : `Save ${formatPriceWithDecimals(coupon.discountAmount)}`,
  }));
  if (couponCode && !couponCards.some(coupon => coupon.code === couponCode)) {
    couponCards.unshift({ code: couponCode, name: couponCode, benefit: "" });
  }
  const couponListFailed = isLogin && availableCoupons.isError && !availableCoupons.data;

  const subtotal = Number(totalAmount);
  const discount = Number(discountAmount);
  const discountPct = subtotal > 0 && discount > 0 ? Math.round((discount / subtotal) * 100) : 0;

  const handleApply = async (code: string) => {
    if (!isLogin || pendingCouponCode !== null) return;
    setPendingCouponCode(code);
    setCouponError(null);
    try {
      const res = await applyCoupon(code);
      successToast(res.message);
    } catch (err) {
      const message = toCartErrorMessage(err);
      setCouponError(message);
      errorToast(message);
    } finally {
      setPendingCouponCode(null);
    }
  };

  const handleRemove = async () => {
    if (pendingCouponCode !== null || !couponCode) return;
    setPendingCouponCode(couponCode);
    setCouponError(null);
    try {
      const res = await removeCoupon();
      successToast(res.message);
    } catch (err) {
      const message = toCartErrorMessage(err);
      setCouponError(message);
      errorToast(message);
    } finally {
      setPendingCouponCode(null);
    }
  };

  return (
    <aside className="h-fit rounded-md border border-border-color p-4 sm:p-5 md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Cart Summary</h2>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between text-sm sm:text-base">
          <span className="text-sky-color">Subtotal</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatPrice(subtotal)}
          </span>
        </div>

        {discount > 0 ? (
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-sky-color">
              Discount{discountPct ? ` (-${discountPct}%)` : ""}
            </span>
            <span className="font-semibold tabular-nums text-foreground">-{formatPrice(discount)}</span>
          </div>
        ) : null}

        {checkout.taxEnabled ? (
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-sky-color">Tax/VAT{taxRates.length ? " (" + taxRates.map(rate => rate + "%").join(", ") + ")" : ""}</span>
            <span className="font-semibold tabular-nums">{formatPriceWithDecimals(vatAmount)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border-color pt-3 text-base sm:pt-4">
          <span className="text-foreground">Estimated Total</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatPrice(Number(payableAmount))}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-sky-color">
        Shipping is calculated at checkout after you select your delivery location.
      </p>

      <div
        hidden={!couponCards.length && !couponListFailed && !couponError}
        className="mt-4 space-y-3 border-t border-border-color pt-4 sm:mt-5"
      >
        {couponCards.length > 0 ? (
          <section aria-label="Coupons" className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Coupons</h3>
            <ul className="grid gap-2">
              {couponCards.map(coupon => {
                const applied = coupon.code === couponCode;
                const busy = pendingCouponCode === coupon.code;
                const details = (
                  <>
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${applied ? "bg-emerald-100 text-emerald-800" : "bg-bg-primary text-foreground"}`}>
                      {applied ? <Check aria-hidden="true" size={18} /> : <Tag aria-hidden="true" size={17} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-foreground">{coupon.benefit || coupon.name}</span>
                      {coupon.benefit && coupon.benefit !== coupon.name ? (
                        <span className="block break-words text-xs text-muted-foreground">{coupon.name}</span>
                      ) : null}
                    </span>
                  </>
                );

                return (
                  <li key={coupon.code} className={`min-w-0 rounded-lg border ${applied ? "flex items-center gap-2 border-emerald-300 bg-emerald-50 p-2.5" : "border-dashed border-border-color"}`}>
                    {applied ? (
                      <>
                        {details}
                        <span className="shrink-0 text-xs font-semibold text-emerald-800">Applied</span>
                        <button
                          type="button"
                          aria-label={`Remove coupon ${coupon.name}`}
                          disabled={pendingCouponCode !== null}
                          onClick={handleRemove}
                          className="flex size-10 shrink-0 items-center justify-center rounded-md text-emerald-900 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                        >
                          {busy ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <X aria-hidden="true" size={17} />}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Apply coupon ${coupon.name}`}
                        disabled={pendingCouponCode !== null}
                        onClick={() => void handleApply(coupon.code)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2.5 text-left transition-colors hover:bg-bg-primary focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-default disabled:opacity-60"
                      >
                        {details}
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
                          {busy ? "Applying…" : "Apply"}
                          {busy ? <LoaderCircle aria-hidden="true" size={14} className="animate-spin" /> : <ChevronRight aria-hidden="true" size={15} />}
                        </span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {couponListFailed ? (
          <p className="text-xs text-muted-foreground">
            Couldn’t load available coupons.{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => void availableCoupons.refetch()}>
              Retry
            </button>
          </p>
        ) : null}
        {couponError ? (
          <p role="alert" className="mt-2 text-sm leading-snug text-danger">
            {couponError}
          </p>
        ) : null}
      </div>

      <Link
        href="/checkout"
        onClick={(e) => {
          if (!isLogin) {
            e.preventDefault();
            router.push("/login?redirect=/checkout");
          }
        }}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-medium text-white transition-colors hover:bg-primary sm:mt-5 sm:h-[54px] sm:text-base"
      >
        Go to Checkout
        <ArrowRight size={18} />
      </Link>
    </aside>
  );
};

export default Subtotal;

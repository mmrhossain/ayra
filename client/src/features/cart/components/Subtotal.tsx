"use client";

import { Input } from "@/components/ui/input";
import { toCartErrorMessage } from "@/features/cart/api";
import { authClient } from "@/lib/api/auth/auth-client";
import { useCartStore } from "@/stores/useCartStore";
import { errorToast, formatPrice, successToast } from "@/helpers";
import { ArrowRight, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Subtotal = () => {
  const {
    totalAmount,
    discountAmount,
    payableAmount,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCartStore();
  const { data } = authClient.useSession();
  const isLogin = Boolean(data?.user);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = Number(totalAmount);
  const discount = Number(discountAmount);
  const discountPct =
    subtotal > 0 && discount > 0 ? Math.round((discount / subtotal) * 100) : 0;

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCouponError("Enter a promo code");
      return;
    }
    if (!isLogin) {
      router.push("/login?redirect=/cart");
      return;
    }
    setCouponBusy(true);
    setCouponError(null);
    try {
      const res = await applyCoupon(trimmed);
      setCode("");
      successToast(res.message);
    } catch (err) {
      const message = toCartErrorMessage(err);
      setCouponError(message);
      errorToast(message);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemove = async () => {
    setCouponBusy(true);
    setCouponError(null);
    try {
      const res = await removeCoupon();
      successToast(res.message);
    } catch (err) {
      const message = toCartErrorMessage(err);
      setCouponError(message);
      errorToast(message);
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <aside className="h-fit rounded-[20px] border border-border-color p-4 sm:p-5 md:p-6">
      <h2 className="mb-4 text-base font-bold text-secondary sm:mb-5 sm:text-lg md:text-xl">
        Order Summary
      </h2>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between text-sm sm:text-[15px] md:text-base">
          <span className="text-sky-color">Subtotal</span>
          <span className="font-bold text-secondary">
            {formatPrice(subtotal)}
          </span>
        </div>

        {discount > 0 ? (
          <div className="flex items-center justify-between text-sm sm:text-[15px] md:text-base">
            <span className="text-sky-color">
              Discount{discountPct ? ` (-${discountPct}%)` : ""}
            </span>
            <span className="font-bold text-danger">
              -{formatPrice(discount)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border-color pt-3 text-base sm:pt-4 sm:text-lg md:text-xl">
          <span className="text-secondary">Total</span>
          <span className="font-bold text-secondary">
            {formatPrice(Number(payableAmount))}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-sky-color">
        Tax and shipping costs will be calculated at checkout.
      </p>

      <div className="mt-4 sm:mt-5">
        {couponCode ? (
          <div className="flex items-center justify-between gap-3 rounded-full bg-bg-primary px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-secondary">
              {couponCode}
            </p>
            <button
              type="button"
              onClick={handleRemove}
              disabled={couponBusy}
              className="shrink-0 text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              {couponBusy ? "Removing..." : "Remove"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Tag
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-color"
              />
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleApply();
                  }
                }}
                placeholder="Add promo code"
                aria-label="Promo code"
                autoCapitalize="characters"
                className="h-11 rounded-full border-0 bg-bg-primary pl-10 pr-4 shadow-none focus-visible:ring-0 sm:h-12"
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={couponBusy}
              className="h-11 shrink-0 cursor-pointer rounded-full bg-secondary px-5 text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-50 sm:h-12 sm:px-7"
            >
              {couponBusy ? "Applying..." : "Apply"}
            </button>
          </div>
        )}
        {couponError ? (
          <p role="alert" className="mt-2 text-xs text-danger">
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
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-secondary text-sm font-medium text-white transition-colors hover:bg-primary sm:mt-5 sm:h-[54px] sm:text-base"
      >
        Go to Checkout
        <ArrowRight size={18} />
      </Link>
    </aside>
  );
};

export default Subtotal;

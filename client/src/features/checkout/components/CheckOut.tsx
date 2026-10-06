"use client";

import { fetchMyCart } from "@/features/checkout/api";
import { CheckoutBack } from "@/features/checkout/components/checkout-ui";
import CheckoutPayment from "@/features/checkout/components/CheckoutPayment";
import CheckoutShipping from "@/features/checkout/components/CheckoutShipping";
import EmptyState from "@/features/checkout/components/EmptyState";
import OrderReview from "@/features/checkout/components/OrderReview";
import { StepBreadcrumb, type CheckoutStep } from "@/features/checkout/components/StepBreadcrumb";
import type { CheckoutPayload } from "@/features/checkout/types";
import CartListSkeleton from "@/skeleton/CartListSkeleton";
import { useCallback, useEffect, useState } from "react";
import CheckOutForm from "./CheckOutFrom";

const CheckOut = () => {
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [step, setStep] = useState<CheckoutStep>("information");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPayload["paymentMethod"]>("COD");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cart = await fetchMyCart();
        if (cancelled) return;
        setItemCount((cart.items ?? []).length);
      } catch {
        if (!cancelled) setItemCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = useCallback(() => {
    if (step === "shipping") setStep("information");
    else if (step === "payment") setStep("shipping");
  }, [step]);

  if (itemCount === null) {
    return <CartListSkeleton />;
  }

  if (itemCount === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-bg-primary pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-6 sm:pt-8 md:pt-10 md:pb-16 lg:pt-12">
      <div className="container min-w-0 max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-10 xl:gap-16 2xl:gap-20">
          <div className="min-w-0">
            {step === "information" ? (
              <CheckoutBack href="/cart" />
            ) : (
              <CheckoutBack onClick={handleBack} />
            )}

            <h1 className="text-[28px] font-extrabold uppercase leading-none tracking-tight text-secondary sm:text-[32px] md:text-[36px] xl:text-[40px]">
              Checkout
            </h1>
            <StepBreadcrumb current={step} onSelect={setStep} />

            <div className="mt-8 sm:mt-10">
              {step === "information" && <CheckOutForm onContinue={setStep} />}
              {step === "shipping" && <CheckoutShipping onContinue={setStep} />}
              {step === "payment" && (
                <CheckoutPayment
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />
              )}
            </div>
          </div>

          <OrderReview paymentMethod={paymentMethod} />
        </div>
      </div>
    </div>
  );
};

export default CheckOut;

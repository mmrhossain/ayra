"use client";

import { CheckoutBack } from "@/features/checkout/components/checkout-ui";
import CheckoutPayment from "@/features/checkout/components/CheckoutPayment";
import CheckoutShipping from "@/features/checkout/components/CheckoutShipping";
import EmptyState from "@/features/checkout/components/EmptyState";
import OrderReview from "@/features/checkout/components/OrderReview";
import { StepBreadcrumb, type CheckoutStep } from "@/features/checkout/components/StepBreadcrumb";
import { useCheckoutCart } from "@/features/checkout/hooks/use-checkout-cart";
import type { CheckoutPayload } from "@/features/checkout/types";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import CheckOutForm from "./CheckOutFrom";

const CheckOut = () => {
  const cartQuery = useCheckoutCart();
  const cartStatus = cartQuery.isPending
    ? "loading"
    : cartQuery.isError
      ? "error"
      : cartQuery.data.items.length
        ? "success"
        : "empty";
  const cartError = cartQuery.error?.message;
  const [step, setStep] = useState<CheckoutStep>("information");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPayload["paymentMethod"]>("COD");
  const handleBack = useCallback(() => {
    if (step === "shipping") setStep("information");
    else if (step === "payment") setStep("shipping");
  }, [step]);

  if (cartStatus === "empty") {
    return <EmptyState />;
  }

  if (cartStatus === "error") {
    return (
      <div className="container storefront-page-start flex max-w-lg flex-col items-center pb-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">We couldn&apos;t load your cart</h1>
        <p role="alert" className="mt-2 text-sm text-muted-foreground">
          {cartError ?? "Please try again in a moment."}
        </p>
        <Button type="button" className="mt-6" onClick={() => void cartQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="storefront-page-start">
      <div className="container min-w-0 max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem]">
        <div className={cn(
          "grid grid-cols-1 gap-y-5 sm:gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start lg:gap-x-10 xl:gap-x-12 2xl:gap-x-16",
          step === "payment" && "lg:grid-rows-[auto_auto_1fr]",
        )}>
          <div className={step === "payment" ? "contents" : "min-w-0 space-y-5 sm:space-y-6"}>
            <div
              className={step === "payment" ? "grid min-w-0 gap-3 lg:col-start-1 lg:row-start-1" : "grid gap-3"}
            >
              {step === "information" ? (
                <CheckoutBack href="/cart" />
              ) : (
                <CheckoutBack onClick={handleBack} />
              )}

              <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-foreground sm:text-2xl">
                Checkout
              </h1>
              <StepBreadcrumb current={step} onSelect={setStep} />
            </div>

            <div className={step === "payment" ? "contents" : "min-w-0"}>
              {step === "information" && <CheckOutForm onContinue={setStep} />}
              {step === "shipping" && <CheckoutShipping onContinue={setStep} />}
              {step === "payment" && (
                <CheckoutPayment
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                >
                  <OrderReview
                    paymentMethod={paymentMethod}
                    className="lg:col-start-2 lg:row-start-1 lg:row-span-3"
                  />
                </CheckoutPayment>
              )}
            </div>
          </div>

          {step !== "payment" ? <OrderReview paymentMethod={paymentMethod} /> : null}
        </div>
      </div>
    </div>
  );
};

export default CheckOut;

"use client";

import { useCheckoutCart } from "@/features/checkout/hooks/use-checkout-cart";
import { CheckoutBack } from "@/features/checkout/components/checkout-ui";
import CheckoutPayment from "@/features/checkout/components/CheckoutPayment";
import CheckoutShipping from "@/features/checkout/components/CheckoutShipping";
import EmptyState from "@/features/checkout/components/EmptyState";
import OrderReview from "@/features/checkout/components/OrderReview";
import { StepBreadcrumb, type CheckoutStep } from "@/features/checkout/components/StepBreadcrumb";
import type { CheckoutPayload } from "@/features/checkout/types";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import CheckOutForm from "./CheckOutFrom";

const CheckOut = () => {
  const cartQuery = useCheckoutCart();
  const cartStatus = cartQuery.isPending ? "loading" : cartQuery.isError ? "error" : cartQuery.data.items.length ? "success" : "empty";
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
      <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
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
    <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-6 sm:pt-8 md:pb-16 md:pt-10 lg:pt-12">
      <div className="container min-w-0 max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start lg:gap-10 xl:gap-16 2xl:gap-20">
          <div className="min-w-0">
            {step === "information" ? (
              <CheckoutBack href="/cart" />
            ) : (
              <CheckoutBack onClick={handleBack} />
            )}

            <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-foreground sm:text-2xl">
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

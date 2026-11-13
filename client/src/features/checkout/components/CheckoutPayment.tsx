"use client";

import { useEffect } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckoutCta,
  CheckoutSection,
  CheckoutStepActions,
} from "@/features/checkout/components/checkout-ui";
import { usePlaceOrder } from "@/features/checkout/hooks/use-place-order";
import { formatPrice } from "@/helpers";
import type { CheckoutPayload } from "@/features/checkout/types";
import { usePublicSettings } from "@/features/settings/public-settings-provider";

type CheckoutPaymentProps = {
  paymentMethod: CheckoutPayload["paymentMethod"];
  onPaymentMethodChange: (method: CheckoutPayload["paymentMethod"]) => void;
};

const CheckoutPayment = ({
  paymentMethod,
  onPaymentMethodChange,
}: CheckoutPaymentProps) => {
  const {
    placeOrder,
    placing,
    loading,
    priceChange,
    confirmPriceChange,
    dismissPriceChange,
  } = usePlaceOrder(paymentMethod);
  const { payment } = usePublicSettings();
  const enabledMethods = payment.enabledMethods;

  useEffect(() => {
    const firstEnabledMethod = enabledMethods[0];
    if (firstEnabledMethod && !enabledMethods.includes(paymentMethod)) {
      onPaymentMethodChange(firstEnabledMethod);
    }
  }, [enabledMethods, onPaymentMethodChange, paymentMethod]);

  return (
    <form
      className="space-y-7 sm:space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void placeOrder();
      }}
    >
      <CheckoutSection title="Payment method">
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) =>
            onPaymentMethodChange(value as CheckoutPayload["paymentMethod"])
          }
          className="grid gap-3"
        >
          {enabledMethods.includes("COD") ? (
            <label
              htmlFor="payment-cod"
              className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 border border-border bg-white p-4 has-[[data-state=checked]]:border-ink"
            >
              <RadioGroupItem
                value="COD"
                id="payment-cod"
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Cash on Delivery
                </p>
                <p className="text-xs leading-relaxed text-neutral-400">
                  Pay in cash when your order arrives.
                </p>
              </div>
            </label>
          ) : null}
          {enabledMethods.includes("SSLCOMMERZ") ? (
            <label
              htmlFor="payment-online"
              className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 border border-border bg-white p-4 has-[[data-state=checked]]:border-ink"
            >
              <RadioGroupItem
                value="SSLCOMMERZ"
                id="payment-online"
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium leading-snug text-foreground">
                  Pay online (Card, bKash, Nagad, Rocket)
                </p>
                <p className="text-xs leading-relaxed text-neutral-400">
                  You will be redirected to SSLCommerz to complete payment.
                </p>
              </div>
            </label>
          ) : null}
        </RadioGroup>
      </CheckoutSection>

      {priceChange ? (
        <CheckoutSection title="Prices have changed">
          <div className="space-y-3 border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm">
              Item prices changed since you opened checkout. Review the current
              prices before placing the order.
            </p>
            <ul className="space-y-1 text-sm">
              {priceChange.items.map((item) => (
                <li key={item.variantId} className="flex justify-between gap-4">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(item.currentUnitPrice)} each
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-2 text-sm font-medium">
              <span>Current product subtotal</span>
              <span className="tabular-nums">
                {formatPrice(priceChange.currentSubtotal)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="border border-ink bg-ink px-4 py-2 text-sm font-medium text-white"
                onClick={confirmPriceChange}
              >
                Accept current prices and place order
              </button>
              <button
                type="button"
                className="border px-4 py-2 text-sm font-medium"
                onClick={dismissPriceChange}
              >
                Go back
              </button>
            </div>
          </div>
        </CheckoutSection>
      ) : null}

      <CheckoutStepActions>
        <CheckoutCta type="submit" loading={loading || placing}>
          {paymentMethod === "SSLCOMMERZ" ? "Pay now" : "Place order"}
        </CheckoutCta>
      </CheckoutStepActions>
    </form>
  );
};

export default CheckoutPayment;

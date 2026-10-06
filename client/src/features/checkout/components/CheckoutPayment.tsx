"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckoutCta,
  CheckoutSection,
  CheckoutStepActions,
} from "@/features/checkout/components/checkout-ui";
import { usePlaceOrder } from "@/features/checkout/hooks/use-place-order";
import type { CheckoutPayload } from "@/features/checkout/types";

type CheckoutPaymentProps = {
  paymentMethod: CheckoutPayload["paymentMethod"];
  onPaymentMethodChange: (method: CheckoutPayload["paymentMethod"]) => void;
};

const CheckoutPayment = ({
  paymentMethod,
  onPaymentMethodChange,
}: CheckoutPaymentProps) => {
  const { placeOrder, placing, loading } = usePlaceOrder(paymentMethod);

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
          <label
            htmlFor="payment-cod"
            className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 border border-[#e5e5e5] bg-white p-4 has-[[data-state=checked]]:border-secondary"
          >
            <RadioGroupItem
              value="COD"
              id="payment-cod"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-secondary">
                Cash on Delivery
              </p>
              <p className="text-xs leading-relaxed text-neutral-400">
                Pay in cash when your order arrives.
              </p>
            </div>
          </label>
          <label
            htmlFor="payment-online"
            className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 border border-[#e5e5e5] bg-white p-4 has-[[data-state=checked]]:border-secondary"
          >
            <RadioGroupItem
              value="SSLCOMMERZ"
              id="payment-online"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium leading-snug text-secondary">
                Pay online (Card, bKash, Nagad, Rocket)
              </p>
              <p className="text-xs leading-relaxed text-neutral-400">
                You will be redirected to SSLCommerz to complete payment.
              </p>
            </div>
          </label>
        </RadioGroup>
      </CheckoutSection>

      <CheckoutStepActions>
        <CheckoutCta type="submit" loading={loading || placing}>
          {paymentMethod === "SSLCOMMERZ" ? "Pay now" : "Place order"}
        </CheckoutCta>
      </CheckoutStepActions>
    </form>
  );
};

export default CheckoutPayment;

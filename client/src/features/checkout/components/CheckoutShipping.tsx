"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectItem } from "@/components/ui/select";
import { DEFAULT_SHIPPING_METHOD_CODE } from "@/constants/shipping";
import {
  CheckoutCta,
  CheckoutSection,
  CheckoutSelect,
  CheckoutStepActions,
} from "@/features/checkout/components/checkout-ui";
import type { CheckoutStep } from "@/features/checkout/components/StepBreadcrumb";
import { useCheckoutShipping } from "@/features/checkout/hooks/use-checkout-shipping";
import { toShippingErrorMessage } from "@/features/shipping/shipping-api";
import { errorToast } from "@/helpers";
import { formatPrice } from "@/lib/format";
import { locationStore } from "@/stores/location.store";
import { useEffect } from "react";

type CheckoutShippingProps = {
  onContinue: (next: CheckoutStep) => void;
};

const CheckoutShipping = ({ onContinue }: CheckoutShippingProps) => {
  const {
    formState,
    handleChange,
    fetchPostList,
    districtList,
    postList,
  } = locationStore();

  const { optionsQuery, shippingOptions } = useCheckoutShipping(
    formState.district,
  );

  useEffect(() => {
    if (!formState.district) {
      if (formState.shippingMethodCode) handleChange("shippingMethodCode", "");
      return;
    }
    if (!shippingOptions.length) {
      if (formState.shippingMethodCode) handleChange("shippingMethodCode", "");
      return;
    }
    const stillValid = shippingOptions.some(
      (option) => option.methodCode === formState.shippingMethodCode,
    );
    if (!stillValid) {
      const preferred =
        shippingOptions.find(
          (option) => option.methodCode === DEFAULT_SHIPPING_METHOD_CODE,
        ) ?? shippingOptions[0];
      handleChange("shippingMethodCode", preferred.methodCode);
    }
  }, [
    formState.district,
    formState.shippingMethodCode,
    handleChange,
    shippingOptions,
  ]);

  const handleThanaChange = (value: string) => {
    const selected = postList?.find((p) => p._id === value);
    handleChange("thana", selected?.name || "");
  };

  const districtId =
    districtList?.find((d) => d.name === formState.district)?._id;

  useEffect(() => {
    if (districtId && !postList?.length) {
      void fetchPostList(districtId);
    }
  }, [districtId, fetchPostList, postList?.length]);

  const handleContinue = () => {
    if (!formState.shippingMethodCode) {
      errorToast("Please select a delivery method");
      return;
    }
    onContinue("payment");
  };

  return (
    <form
      className="space-y-7 sm:space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        handleContinue();
      }}
    >
      <CheckoutSection title="Shipping to">
        <div className="border border-[#eee] bg-white px-4 py-3 text-sm leading-relaxed text-secondary">
          <p className="font-medium">{formState.name}</p>
          <p className="mt-1 text-neutral-500">
            {[formState.address, formState.thana, formState.district, formState.division, formState.postal_code]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="mt-1 text-neutral-500">
            {formState.phone}
            {formState.email ? ` · ${formState.email}` : ""}
          </p>
        </div>
      </CheckoutSection>

      <CheckoutSection title="Area / Thana">
        <CheckoutSelect
          label="Area / Thana"
          placeholder="Select thana"
          value={postList?.find((p) => p.name === formState.thana)?._id || ""}
          onValueChange={handleThanaChange}
          disabled={!formState.district}
        >
          {(postList ?? []).map((post) => (
            <SelectItem key={post._id} value={post._id}>
              {post.name}
            </SelectItem>
          ))}
        </CheckoutSelect>
      </CheckoutSection>

      <CheckoutSection title="Delivery method">
        <p className="text-xs text-neutral-400">
          {formState.district
            ? optionsQuery.data?.zone?.name
              ? `Zone for ${formState.district}: ${optionsQuery.data.zone.name}`
              : "Choose a delivery method for this address."
            : "Select a city on the previous step to see delivery methods."}
        </p>
        {!formState.district ? (
          <p className="text-sm text-neutral-400">
            Select a city first to load shipping options.
          </p>
        ) : optionsQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading shipping options...</p>
        ) : optionsQuery.isError ? (
          <p className="text-sm text-danger" role="alert">
            {toShippingErrorMessage(optionsQuery.error)}
          </p>
        ) : shippingOptions.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No shipping methods are available for this city.
          </p>
        ) : (
          <RadioGroup
            value={formState.shippingMethodCode}
            onValueChange={(value) => handleChange("shippingMethodCode", value)}
            className="grid gap-3"
          >
            {shippingOptions.map((option) => (
              <label
                key={option.methodCode}
                htmlFor={`shipping-method-${option.methodCode}`}
                className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 border border-[#e5e5e5] bg-white p-4 has-[[data-state=checked]]:border-secondary"
              >
                <RadioGroupItem
                  value={option.methodCode}
                  id={`shipping-method-${option.methodCode}`}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-secondary">
                      {option.methodName}
                    </p>
                    <span className="shrink-0 text-sm text-secondary">
                      {option.isFreeShipping
                        ? "Free"
                        : formatPrice(option.shippingAmount)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-400">
                    {option.isFreeShipping
                      ? "Free shipping applied for this order."
                      : option.freeShippingFrom != null
                        ? `Free shipping from ${formatPrice(option.freeShippingFrom)}`
                        : option.zoneName}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
        )}
      </CheckoutSection>

      <CheckoutStepActions>
        <CheckoutCta type="submit">Payment</CheckoutCta>
      </CheckoutStepActions>
    </form>
  );
};

export default CheckoutShipping;

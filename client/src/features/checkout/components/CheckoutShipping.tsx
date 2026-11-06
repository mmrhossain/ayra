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
    fetchUpazilaList,
    districtList,
    upazilaList,
  } = locationStore();

  const districtCode =
    formState.districtCode ||
    districtList?.find((district) => district.name === formState.district)
      ?.code ||
    "";

  const { optionsQuery, shippingOptions } = useCheckoutShipping(
    formState.district,
    districtCode,
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
    const selected = upazilaList?.find((upazila) => upazila.code === value);
    handleChange("thana", selected?.name || "");
    handleChange("upazilaCode", value);
  };

  useEffect(() => {
    if (districtCode && !upazilaList?.length) {
      void fetchUpazilaList(districtCode);
    }
  }, [districtCode, fetchUpazilaList, upazilaList?.length]);

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
        <div className="border border-border bg-white px-4 py-3 text-sm leading-relaxed text-foreground">
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
          value={
            formState.upazilaCode ||
            upazilaList?.find((upazila) => upazila.name === formState.thana)
              ?.code ||
            ""
          }
          onValueChange={handleThanaChange}
          disabled={!formState.district}
        >
          {(upazilaList ?? []).map((upazila) => (
            <SelectItem key={upazila.code} value={upazila.code}>
              {upazila.name}
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
                className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 border border-border bg-white p-4 has-[[data-state=checked]]:border-ink"
              >
                <RadioGroupItem
                  value={option.methodCode}
                  id={`shipping-method-${option.methodCode}`}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {option.methodName}
                    </p>
                    <span className="shrink-0 text-sm text-foreground">
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

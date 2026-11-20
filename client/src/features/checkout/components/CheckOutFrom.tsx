"use client";

import {
  CheckoutCta,
  CheckoutField,
  CheckoutSection,
  CheckoutSelect,
  CheckoutStepActions,
} from "@/features/checkout/components/checkout-ui";
import type { CheckoutStep } from "@/features/checkout/components/StepBreadcrumb";
import { joinFullName, splitFullName } from "@/features/checkout/lib/split-name";
import {
  fetchMyAddresses,
  type SavedAddress,
} from "@/features/dashboard/customer/address/api/addresses";
import { authClient } from "@/lib/api/auth/auth-client";
import { bdPhoneSchema } from "@/lib/validators/bangladesh";
import { locationStore } from "@/stores/location.store";
import Link from "next/link";
import { useEffect, useState } from "react";

type CheckOutFormProps = {
  cartReady: boolean;
  onContinue: (next: CheckoutStep) => void;
};

const pickSavedAddress = (addresses: SavedAddress[]): SavedAddress | null => {
  return (
    addresses.find((a) => a.isDefaultShipping) ??
    addresses.find((a) => a.isDefaultBilling) ??
    addresses[0] ??
    null
  );
};

const CheckOutForm = ({ cartReady, onContinue }: CheckOutFormProps) => {
  const initialName = splitFullName(locationStore.getState().formState.name);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isPending: sessionPending } = authClient.useSession();
  const user = data?.user;
  const userId = user?.id ?? null;
  const userName = user?.name ?? "";
  const userEmail = user?.email ?? "";

  const [hydrated, setHydrated] = useState(false);
  const formBusy = !cartReady || sessionPending || !hydrated;

  const {
    formState,
    handleChange,
    fetchDivisionList,
    fetchDistrictList,
    fetchUpazilaList,
    divisionList,
    districtList,
    geoError,
  } = locationStore();

  useEffect(() => {
    if (!cartReady || sessionPending) return;
    if (!userId) {
      queueMicrotask(() => setHydrated(true));
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      try {
        const [saved] = await Promise.all([
          fetchMyAddresses().then(pickSavedAddress).catch(() => null),
          fetchDivisionList(),
        ]);

        if (cancelled) return;

        handleChange("name", saved?.fullName || userName || "");
        handleChange("email", saved?.email || userEmail || "");
        handleChange("phone", saved?.phone || "");
        handleChange("country", saved?.country || "Bangladesh");
        handleChange("address", saved?.addressLine1 || "");
        handleChange("division", saved?.division || "");
        handleChange("district", saved?.district || "");
        handleChange("thana", saved?.thana || "");
        handleChange("divisionCode", saved?.divisionCode || "");
        handleChange("districtCode", saved?.districtCode || "");
        handleChange("upazilaCode", saved?.upazilaCode || "");
        handleChange("postal_code", saved?.postalCode || "");

        const parts = splitFullName(saved?.fullName || userName || "");
        setFirstName(parts.firstName);
        setLastName(parts.lastName);

        if (saved?.division) {
          const state = locationStore.getState();
          const division =
            state.divisionList?.find((d) => d.code === saved.divisionCode) ??
            state.divisionList?.find((d) => d.name === saved.division);
          if (division) {
            handleChange("division", division.name);
            handleChange("divisionCode", division.code);
            await fetchDistrictList(division.code);
            if (cancelled) return;
            const district =
              locationStore
                .getState()
                .districtList?.find((d) => d.code === saved.districtCode) ??
              locationStore
                .getState()
                .districtList?.find((d) => d.name === saved.district);
            if (district) {
              handleChange("district", district.name);
              handleChange("districtCode", district.code);
              await fetchUpazilaList(district.code);
              if (cancelled) return;
              const upazila =
                locationStore
                  .getState()
                  .upazilaList?.find((u) => u.code === saved.upazilaCode) ??
                locationStore
                  .getState()
                  .upazilaList?.find((u) => u.name === saved.thana);
              if (upazila) {
                handleChange("thana", upazila.name);
                handleChange("upazilaCode", upazila.code);
              }
            }
          }
        }
      } finally {
        if (!cancelled) {
          queueMicrotask(() => setHydrated(true));
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    cartReady,
    userId,
    sessionPending,
    userName,
    userEmail,
    fetchDivisionList,
    fetchDistrictList,
    fetchUpazilaList,
    handleChange,
  ]);

  const handleDivisionChange = async (value: string) => {
    const selected = divisionList?.find((d) => d.code === value);
    handleChange("division", selected?.name || "");
    handleChange("divisionCode", value);
    handleChange("district", "");
    handleChange("districtCode", "");
    handleChange("thana", "");
    handleChange("upazilaCode", "");
    setErrors((prev) => ({ ...prev, division: "", district: "" }));
    if (value) await fetchDistrictList(value);
  };

  const handleDistrictChange = async (value: string) => {
    const selected = districtList?.find((d) => d.code === value);
    handleChange("district", selected?.name || "");
    handleChange("districtCode", value);
    handleChange("thana", "");
    handleChange("upazilaCode", "");
    setErrors((prev) => ({ ...prev, district: "" }));
    if (value) await fetchUpazilaList(value);
  };

  const updateFirstName = (value: string) => {
    setFirstName(value);
    handleChange("name", joinFullName(value, lastName));
    setErrors((prev) => ({ ...prev, firstName: "" }));
  };

  const updateLastName = (value: string) => {
    setLastName(value);
    handleChange("name", joinFullName(firstName, value));
  };

  const handleContinue = () => {
    if (formBusy) return;
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!formState.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      nextErrors.email = "Enter a valid email";
    }
    if (!formState.phone.trim()) nextErrors.phone = "Phone is required";
    else if (!bdPhoneSchema.safeParse(formState.phone).success) {
      nextErrors.phone = "Enter a valid Bangladesh phone number";
    }
    if (!formState.address.trim()) nextErrors.address = "Address is required";
    if (!formState.division) nextErrors.division = "Select a state / region";
    if (!formState.district) nextErrors.district = "Select a city";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const firstId = Object.keys(nextErrors)[0];
      document.getElementById(`checkout-${firstId}`)?.focus();
      return;
    }

    onContinue("shipping");
  };

  return (
    <form
      className="space-y-7 sm:space-y-8 relative"
      onSubmit={(e) => {
        e.preventDefault();
        handleContinue();
      }}
    >
      {formBusy ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground"
        >
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          Preparing your checkout...
        </p>
      ) : null}

      <CheckoutSection
        title="Contact info"
        action={
          !user ? (
            <Link
              href="/login"
              className="text-xs text-neutral-400 underline underline-offset-2 hover:text-foreground"
            >
              Log in
            </Link>
          ) : null
        }
      >
        <div className="space-y-3">
          <CheckoutField
            id="checkout-email"
            label="Email"
            placeholder="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={formState.email}
            onChange={(e) => {
              handleChange("email", e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
            required
            disabled={formBusy}
          />
          <CheckoutField
            id="checkout-phone"
            label="Phone"
            placeholder="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formState.phone}
            onChange={(e) => {
              handleChange("phone", e.target.value);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            error={errors.phone}
            required
            disabled={formBusy}
          />
        </div>
      </CheckoutSection>

      <CheckoutSection title="Shipping address">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CheckoutField
            id="checkout-firstName"
            label="First name"
            placeholder="First Name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => updateFirstName(e.target.value)}
            error={errors.firstName}
            required
            disabled={formBusy}
          />
          <CheckoutField
            id="checkout-lastName"
            label="Last name"
            placeholder="Last Name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => updateLastName(e.target.value)}
            disabled={formBusy}
          />
        </div>

        <CheckoutSelect
          label="Country"
          placeholder="Country"
          value={formState.country || "Bangladesh"}
          onValueChange={(value) => handleChange("country", value)}
          disabled={formBusy}
          options={[{ value: "Bangladesh", label: "Bangladesh" }]}
        />

        <CheckoutSelect
          label="State / Region"
          placeholder="State / Region"
          value={
            formState.divisionCode ||
            divisionList?.find((d) => d.name === formState.division)?.code ||
            ""
          }
          onValueChange={handleDivisionChange}
          error={errors.division}
          disabled={formBusy}
          options={(divisionList ?? []).map(div => ({ value: div.code, label: div.name }))}
        />
        {geoError ? (
          <p className="text-sm leading-snug text-danger" role="alert">
            {geoError}
          </p>
        ) : null}

        <CheckoutField
          id="checkout-address"
          label="Address"
          placeholder="Address"
          autoComplete="street-address"
          value={formState.address}
          onChange={(e) => {
            handleChange("address", e.target.value);
            setErrors((prev) => ({ ...prev, address: "" }));
          }}
          error={errors.address}
          required
          disabled={formBusy}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CheckoutSelect
            label="City"
            placeholder="City"
            value={
              formState.districtCode ||
              districtList?.find((d) => d.name === formState.district)?.code ||
              ""
            }
            onValueChange={handleDistrictChange}
            disabled={formBusy || !formState.division}
            error={errors.district}
            options={(districtList ?? []).map(dist => ({ value: dist.code, label: dist.name }))}
          />
          <CheckoutField
            id="checkout-postal"
            label="Postal code"
            placeholder="Postal Code"
            inputMode="numeric"
            autoComplete="postal-code"
            value={formState.postal_code}
            onChange={(e) => handleChange("postal_code", e.target.value)}
            disabled={formBusy}
          />
        </div>
      </CheckoutSection>

      <CheckoutStepActions>
        <CheckoutCta type="submit" disabled={formBusy}>
          Shipping
        </CheckoutCta>
      </CheckoutStepActions>
    </form>
  );
};

export default CheckOutForm;

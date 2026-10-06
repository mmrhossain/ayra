import { DashboardApiError } from "@/lib/api/dashboard";
import type { AddressFormValues } from "@/features/dashboard/customer/address/schemas";
import type { SavedAddress } from "@/features/dashboard/customer/address/types";

export function toAddressError(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export const emptyAddressForm: AddressFormValues = {
  label: "",
  fullName: "",
  phone: "",
  email: "",
  country: "Bangladesh",
  addressLine1: "",
  division: "",
  district: "",
  thana: "",
  postalCode: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export function addressFormDefaults(
  address?: SavedAddress | null,
  userName?: string,
): AddressFormValues {
  if (!address) {
    return { ...emptyAddressForm, fullName: userName ?? "" };
  }
  return {
    label: address.label ?? "",
    fullName: address.fullName || userName || "",
    phone: address.phone,
    email: address.email ?? "",
    country: address.country || "Bangladesh",
    addressLine1: address.addressLine1,
    division: address.division,
    district: address.district,
    thana: address.thana ?? "",
    postalCode: address.postalCode ?? "",
    isDefaultShipping: address.isDefaultShipping,
    isDefaultBilling: address.isDefaultBilling,
  };
}

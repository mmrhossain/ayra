export type { Envelope } from "@/lib/api/http";

export type SavedAddress = {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  country: string;
  division: string;
  district: string;
  thana?: string | null;
  area?: string | null;
  postalCode?: string | null;
  divisionCode?: string | null;
  districtCode?: string | null;
  upazilaCode?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AddressPayload = {
  label?: string;
  fullName: string;
  phone: string;
  email?: string;
  country?: string;
  division: string;
  district: string;
  thana?: string;
  area?: string;
  postalCode?: string;
  divisionCode?: string;
  districtCode?: string;
  upazilaCode?: string;
  addressLine1: string;
  addressLine2?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

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
  addressLine1: string;
  addressLine2?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

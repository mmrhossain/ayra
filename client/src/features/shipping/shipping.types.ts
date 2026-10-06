export type ShippingZone = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isFallback: boolean;
  matchDistricts: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingRate = {
  id: string;
  price: number | string;
  freeShippingFrom: number | string | null;
  isActive: boolean;
  shippingZoneId: string;
  shippingMethodId: string;
  createdAt?: string;
  updatedAt?: string;
  shippingZone?: ShippingZone;
  shippingMethod?: ShippingMethod;
};

export type ShippingQuote = {
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  methodId: string;
  methodName: string;
  methodCode: string;
  rateId: string;
  price: number;
  freeShippingFrom: number | null;
  shippingAmount: number;
  isFreeShipping: boolean;
};

export type ShippingOptionsResult = {
  zone: {
    id: string;
    name: string;
    code: string;
  };
  options: ShippingQuote[];
};

export type CreateShippingZoneBody = {
  name: string;
  code: string;
  isActive: boolean;
  isFallback: boolean;
  matchDistricts: string[];
};

export type CreateShippingMethodBody = {
  name: string;
  code: string;
  isActive: boolean;
};

export type CreateShippingRateBody = {
  shippingZoneId: string;
  shippingMethodId: string;
  price: number;
  freeShippingFrom?: number | null;
  isActive: boolean;
};

export type PaymentMethodCode = "COD" | "SSLCOMMERZ";

export type PublicSettings = {
  store: {
    name: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    logoUrl: string;
    currency: string;
  };
  payment: {
    enabledMethods: PaymentMethodCode[];
  };
  checkout: {
    pricesIncludeTax: boolean;
    taxRatePercent: number;
    freeShippingThreshold: number | null;
  };
};

export type SettingsEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PaymentMethodCode = "COD" | "SSLCOMMERZ";

export type PublicSettings = {
  store: {
    name: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    logoUrl: string;
    ogImageUrl: string;
    currency: string;
  };
  payment: {
    enabledMethods: PaymentMethodCode[];
  };
  checkout: {
    taxEnabled: boolean;
  };
};

export type SettingsEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

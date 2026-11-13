import { SITE_LOGO, SITE_NAME, SUPPORT_EMAIL } from "@/config/site";
import type { PublicSettings } from "@/features/settings/types";

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  store: {
    name: SITE_NAME,
    supportEmail: SUPPORT_EMAIL,
    supportPhone: "",
    address: "Gulshan-2, Dhaka\nBangladesh",
    logoUrl: SITE_LOGO,
    currency: "BDT",
  },
  payment: {
    enabledMethods: ["COD", "SSLCOMMERZ"],
  },
  checkout: {
    pricesIncludeTax: true,
    taxRatePercent: 0,
    freeShippingThreshold: null,
  },
};

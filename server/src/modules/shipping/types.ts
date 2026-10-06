import type { z } from "zod";
import type {
  createShippingMethodSchema,
  createShippingRateSchema,
  createShippingZoneSchema,
  shippingOptionsQuerySchema,
  shippingQuoteSchema,
  updateShippingMethodSchema,
  updateShippingRateSchema,
  updateShippingZoneSchema,
} from "./validators/shipping.validators.ts";

export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type CreateShippingMethodInput = z.infer<typeof createShippingMethodSchema>;
export type UpdateShippingMethodInput = z.infer<typeof updateShippingMethodSchema>;
export type CreateShippingRateInput = z.infer<typeof createShippingRateSchema>;
export type UpdateShippingRateInput = z.infer<typeof updateShippingRateSchema>;
export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;
export type ShippingOptionsQuery = z.infer<typeof shippingOptionsQuerySchema>;

export type AddressLike = {
  district?: string | null | undefined;
  division?: string | null | undefined;
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

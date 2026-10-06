import { z } from "zod";

import {
  shippingMethodFormSchema,
  shippingRateFormSchema,
  shippingZoneFormSchema,
} from "@/features/shipping/shipping.schema";

export {
  optionalText,
  shippingMethodFormSchema,
  shippingRateFormSchema,
  shippingZoneFormSchema,
} from "@/features/shipping/shipping.schema";

export type ShippingZoneFormValues = z.infer<typeof shippingZoneFormSchema>;
export type ShippingMethodFormValues = z.infer<typeof shippingMethodFormSchema>;
export type ShippingRateFormValues = z.infer<typeof shippingRateFormSchema>;

import { z } from "zod";
import { addressFieldsSchema } from "../../../common/validators/address.ts";

export const addressIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createAddressSchema = addressFieldsSchema.extend({
  label: z.string().optional(),
  area: z.string().optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

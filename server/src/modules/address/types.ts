import type { z } from "zod";
import type {
  createAddressSchema,
  updateAddressSchema,
} from "./validators/address.validators.ts";

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export type DefaultAddressFlags = {
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

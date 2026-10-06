import type { z } from "zod";
import type {
  updateCustomerProfileSchema,
  updateVendorProfileSchema,
} from "./validators/profile.validators.ts";

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>;

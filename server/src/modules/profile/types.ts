import type { z } from "zod";
import type {
  updateCustomerProfileSchema,
  updateNotificationPreferencesSchema,
} from "./validators/profile.validators.ts";

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

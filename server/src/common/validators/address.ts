import { z } from "zod";
import { bdPhoneSchema } from "./bangladesh.ts";

export const addressFieldsSchema = z.object({
  fullName: z.string().min(1),
  phone: bdPhoneSchema,
  email: z.string().email().optional(),
  country: z.string().min(1).default("Bangladesh"),
  division: z.string().min(1),
  district: z.string().min(1),
  thana: z.string().optional(),
  postalCode: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
});

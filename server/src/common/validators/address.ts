import { z } from "zod";
import { bdPhoneSchema } from "./bangladesh.ts";

const geoCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{1,32}$/, "Invalid geography code");

export const addressFieldsSchema = z.object({
  fullName: z.string().min(1),
  phone: bdPhoneSchema,
  email: z.string().email().optional(),
  country: z.string().min(1).default("Bangladesh"),
  division: z.string().min(1),
  district: z.string().min(1),
  thana: z.string().optional(),
  divisionCode: geoCodeSchema.optional(),
  districtCode: geoCodeSchema.optional(),
  upazilaCode: geoCodeSchema.optional(),
  postalCode: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
});

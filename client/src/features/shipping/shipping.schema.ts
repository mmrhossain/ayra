import { z } from "zod";

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1).optional(),
);

export const shippingZoneFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphen, or underscore"),
  isActive: z.boolean(),
  isFallback: z.boolean(),
  matchDistricts: z.string(),
});

export const shippingMethodFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphen, or underscore"),
  isActive: z.boolean(),
});

export const shippingRateFormSchema = z.object({
  shippingZoneId: z.string().min(1, "Zone is required"),
  shippingMethodId: z.string().min(1, "Method is required"),
  price: z.coerce.number().nonnegative("Price cannot be negative"),
  freeShippingFrom: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce.number().nonnegative().nullable(),
  ),
  isActive: z.boolean(),
});

export { optionalText };

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
  price: z.preprocess((v) => {
    if (v === "" || v === undefined || v === null) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, z
    .number({ error: "Price is required" })
    .nonnegative("Price cannot be negative")
    .max(1_000_000, "Price is too large")
    .multipleOf(0.01, "Use at most 2 decimal places")),
  freeShippingFrom: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce
      .number()
      .nonnegative("Amount cannot be negative")
      .max(1_000_000, "Amount is too large")
      .multipleOf(0.01, "Use at most 2 decimal places")
      .nullable(),
  ),
  isActive: z.boolean(),
});

export { optionalText };

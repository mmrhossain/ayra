import { z } from "zod";

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1).optional(),
);

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email("Invalid email").optional(),
);

export const warehouseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  phone: optionalText,
  email: optionalEmail,
  country: z.string().min(1, "Country is required"),
  state: optionalText,
  city: z.string().min(1, "City is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: optionalText,
  isActive: z.boolean(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

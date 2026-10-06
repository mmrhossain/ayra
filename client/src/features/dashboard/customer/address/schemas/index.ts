import { z } from "zod";

import { bdPhoneSchema } from "@/lib/validators/bangladesh";

export const addressFormSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().optional(),
  phone: bdPhoneSchema,
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  country: z.string().optional(),
  addressLine1: z.string().min(1, "Street address is required"),
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  thana: z.string().optional(),
  postalCode: z.string().optional(),
  isDefaultShipping: z.boolean(),
  isDefaultBilling: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

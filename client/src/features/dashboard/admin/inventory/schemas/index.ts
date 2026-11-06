import { z } from "zod";

import { REASONS } from "@/features/dashboard/admin/inventory/utils";

export const adjustFormSchema = z.object({
  type: z.enum(["increase", "decrease", "set"]),
  quantity: z
    .string({ error: "Quantity is required" })
    .trim()
    .min(1, "Quantity is required")
    .regex(/^\d+$/, "Enter a whole number")
    .refine((value) => Number(value) <= Number.MAX_SAFE_INTEGER, "Quantity is too large"),
  reason: z.enum(REASONS),
  notes: z.string().optional(),
});

export type AdjustFormValues = z.infer<typeof adjustFormSchema>;

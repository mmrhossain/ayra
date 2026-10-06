import { z } from "zod";

import { REASONS } from "@/features/dashboard/admin/inventory/utils";

export const adjustFormSchema = z.object({
  type: z.enum(["increase", "decrease", "set"]),
  quantity: z.number().int().nonnegative("Quantity cannot be negative"),
  reason: z.enum(REASONS),
  notes: z.string().optional(),
});

export type AdjustFormValues = z.infer<typeof adjustFormSchema>;

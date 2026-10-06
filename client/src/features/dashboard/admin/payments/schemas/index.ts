import { z } from "zod";

export function refundSchema(maxAmount: number) {
  return z.object({
    amount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .multipleOf(0.01)
      .max(maxAmount, `Amount cannot exceed ${maxAmount}`),
    reason: z.string().max(500).optional(),
  });
}

export type RefundFormValues = z.infer<ReturnType<typeof refundSchema>>;

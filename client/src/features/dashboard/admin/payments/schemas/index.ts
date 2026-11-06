import { z } from "zod";

export function refundSchema(maxAmount: number) {
  return z.object({
    amount: z.preprocess((v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    }, z
      .number({ error: "Amount is required" })
      .positive("Amount must be greater than 0")
      .multipleOf(0.01)
      .max(maxAmount, `Amount cannot exceed ${maxAmount}`)),
    reason: z.string().max(500).optional(),
  });
}

export type RefundFormValues = z.infer<ReturnType<typeof refundSchema>>;

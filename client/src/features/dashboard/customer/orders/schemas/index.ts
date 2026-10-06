import { z } from "zod";

export const returnRequestSchema = z.object({
  reason: z.string().min(1, "Select a reason"),
  items: z
    .array(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().int().min(0),
        restockOrRefund: z.enum(["RESTOCK", "REFUND"]),
      }),
    )
    .refine((items) => items.some((item) => item.quantity > 0), {
      message: "Select at least one item",
    }),
});

export type ReturnRequestFormValues = z.infer<typeof returnRequestSchema>;

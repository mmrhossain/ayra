import { z } from "zod";

import { HEX_COLOR } from "@/features/dashboard/admin/attributes/utils";

export const attributeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const attributeValueFormSchema = z
  .object({
    value: z.string().min(1, "Value is required").max(2000),
    color: z.string().optional(),
    requireColor: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.requireColor) return;
    if (!data.color || !HEX_COLOR.test(data.color)) {
        ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["color"],
        message: "Color must be #RRGGBB",
      });
    }
  });

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;
export type AttributeValueFormValues = z.infer<typeof attributeValueFormSchema>;

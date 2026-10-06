import { z } from "zod";

export const sliderFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    imageUrl: z.string().min(1, "Image is required"),
    imagePublicId: z.string().optional(),
    mobileImageUrl: z.string().optional(),
    mobileImagePublicId: z.string().optional(),
    redirectUrl: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    priority: z.string().trim().min(1, "Priority is required"),
    isActive: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (
      values.redirectUrl &&
      !/^https?:\/\/.+/i.test(values.redirectUrl.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["redirectUrl"],
        message: "Enter a valid URL",
      });
    }
    const priority = Number(values.priority);
    if (!Number.isInteger(priority) || priority < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["priority"],
        message: "Priority must be 0 or greater",
      });
    }
  });

export type SliderFormValues = z.infer<typeof sliderFormSchema>;

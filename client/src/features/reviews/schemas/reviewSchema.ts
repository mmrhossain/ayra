import * as z from "zod";

export const reviewSchema = z.object({
    rating: z.number().int().min(1, "Select a rating").max(5),
    comment: z.string().max(2000, "Comment is too long").optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

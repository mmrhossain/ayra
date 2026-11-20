import { z } from "zod";

const taxClassSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/).transform(value => value.toUpperCase()),
  rate: z.number().min(0).max(100).multipleOf(0.01),
  isActive: z.boolean(),
});

export const createTaxClassSchema = taxClassSchema.extend({ isActive: z.boolean().default(true) });
export const updateTaxClassSchema = taxClassSchema.partial();

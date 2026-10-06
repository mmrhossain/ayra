import { z } from "zod";

export const createAttributeSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateAttributeSchema = createAttributeSchema.partial();

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be #RRGGBB")
  .transform((value) => value.toUpperCase());

export const createAttributeValueSchema = z.object({
  value: z.string().min(1).max(100),
  color: hexColorSchema.optional(),
});

export const updateAttributeValueSchema = createAttributeValueSchema.partial();

export const createAttributeValuesSchema = z.object({
  values: z.array(createAttributeValueSchema).min(1).max(100),
});

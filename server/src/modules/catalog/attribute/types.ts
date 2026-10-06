import type { z } from "zod";
import type {
  createAttributeSchema,
  createAttributeValueSchema,
  createAttributeValuesSchema,
  updateAttributeSchema,
  updateAttributeValueSchema,
} from "./validators/attribute.validators.ts";

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;
export type CreateAttributeValueInput = z.infer<typeof createAttributeValueSchema>;
export type CreateAttributeValuesInput = z.infer<typeof createAttributeValuesSchema>;
export type UpdateAttributeValueInput = z.infer<typeof updateAttributeValueSchema>;

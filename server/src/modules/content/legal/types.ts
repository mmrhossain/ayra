import type { z } from "zod";
import type {
  createLegalDocumentSchema,
  legalTypeSchema,
  listLegalQuerySchema,
  updateLegalDocumentSchema,
} from "./validators/legal.validators.ts";

export type LegalType = z.infer<typeof legalTypeSchema>;
export type CreateLegalDocumentInput = z.infer<typeof createLegalDocumentSchema>;
export type UpdateLegalDocumentInput = z.infer<typeof updateLegalDocumentSchema>;
export type ListLegalQuery = z.infer<typeof listLegalQuerySchema>;

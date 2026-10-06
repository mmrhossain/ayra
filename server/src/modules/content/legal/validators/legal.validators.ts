import { z } from "zod";
import { paginationQuerySchema } from "../../../../common/validators/pagination.ts";

export const legalTypeSchema = z.enum(["PRIVACY", "TERMS"]);

export const legalTypeParamSchema = z.object({
  type: legalTypeSchema,
});

export const createLegalDocumentSchema = z.object({
  type: legalTypeSchema,
  version: z.string().trim().min(1).max(32),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  effectiveAt: z.coerce.date().optional(),
});

export const updateLegalDocumentSchema = z.object({
  version: z.string().trim().min(1).max(32).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().min(1).optional(),
  effectiveAt: z.coerce.date().nullable().optional(),
});

export const listLegalQuerySchema = paginationQuerySchema.extend({
  type: legalTypeSchema.optional(),
});

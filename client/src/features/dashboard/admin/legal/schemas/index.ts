import { z } from "zod";

import { LEGAL_TYPES } from "@/features/dashboard/admin/legal/types";

export const legalFormSchema = z.object({
  type: z.enum(LEGAL_TYPES),
  version: z.string().min(1, "Version is required").max(32),
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Body is required"),
  effectiveAt: z.string().optional(),
});

export type LegalFormValues = z.infer<typeof legalFormSchema>;

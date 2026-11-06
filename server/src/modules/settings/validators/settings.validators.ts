import { z } from "zod";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";

export const updateSettingsSchema = z.object({
  values: z.record(z.string(), z.unknown()),
});

export const settingsAuditQuerySchema = paginationQuerySchema;

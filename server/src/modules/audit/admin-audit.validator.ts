import { z } from "zod";
import {
  dateRangeQuerySchema,
  paginationQuerySchema,
} from "../../common/validators/pagination.ts";

export const listAdminAuditLogsQuerySchema = paginationQuerySchema
  .extend(dateRangeQuerySchema.shape)
  .extend({
    actorId: z.string().trim().min(1).optional(),
    actorEmail: z.string().trim().min(1).max(200).optional(),
    entityType: z.string().trim().min(1).optional(),
    method: z.enum(["POST", "PUT", "PATCH", "DELETE"]).optional(),
    status: z.coerce.number().int().min(100).max(599).optional(),
    action: z.string().trim().min(1).max(200).optional(),
    source: z.enum(["APP", "STAFF", "AUTH", "SYSTEM"]).optional(),
    outcome: z.enum(["SUCCESS", "FAILURE"]).optional(),
    search: z.string().trim().min(1).max(200).optional(),
  });

export const exportAdminAuditLogsQuerySchema = listAdminAuditLogsQuerySchema.omit(
  { page: true, limit: true },
);

import type { Prisma } from "../../generated/prisma/client.ts";

export type CreateAdminAuditLogInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action?: string | null;
  source?: string | null;
  method: string;
  path: string;
  statusCode: number;
  outcome?: "SUCCESS" | "FAILURE" | null;
  entityType?: string | null;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  metadata?: Prisma.InputJsonValue | undefined;
};

export type ListAdminAuditLogsQuery = {
  page: number;
  limit: number;
  from?: string | undefined;
  to?: string | undefined;
  actorId?: string | undefined;
  actorEmail?: string | undefined;
  entityType?: string | undefined;
  method?: string | undefined;
  status?: number | undefined;
  action?: string | undefined;
  source?: string | undefined;
  outcome?: "SUCCESS" | "FAILURE" | undefined;
  search?: string | undefined;
};

export type AdminAuditLogItem = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string | null;
  source: string;
  method: string;
  path: string;
  statusCode: number;
  outcome: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  durationMs: number | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

export type { Envelope } from "@/lib/api/http";

export type AuditLogSource = "APP" | "STAFF" | "AUTH" | "SYSTEM";
export type AuditLogOutcome = "SUCCESS" | "FAILURE";

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
  metadata: unknown;
  createdAt: string;
};

export type AuditLogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AuditLogListResult = {
  items: AdminAuditLogItem[];
  pagination: AuditLogPagination;
};

export type AuditLogMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export type AuditLogListParams = {
  page?: number;
  limit?: number;
  actorId?: string;
  actorEmail?: string;
  entityType?: string;
  action?: string;
  method?: AuditLogMethod;
  source?: AuditLogSource;
  outcome?: AuditLogOutcome;
  status?: number;
  search?: string;
  from?: string;
  to?: string;
};

export type AuditLogExportParams = Omit<AuditLogListParams, "page" | "limit">;

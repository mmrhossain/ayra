import { dashboardApi } from "@/lib/api/dashboard";
import { buildUrl } from "@/lib/api/http";
import type {
  AdminAuditLogItem,
  AuditLogExportParams,
  AuditLogListParams,
  AuditLogListResult,
  Envelope,
} from "@/features/dashboard/admin/audit-log/types/models";

export type {
  AdminAuditLogItem,
  AuditLogExportParams,
  AuditLogListParams,
  AuditLogListResult,
  AuditLogMethod,
  AuditLogOutcome,
  AuditLogPagination,
  AuditLogSource,
  Envelope,
} from "@/features/dashboard/admin/audit-log/types/models";

export {
  formatAuditActor,
  formatAuditDuration,
  formatAuditEntity,
  formatAuditMetadata,
  formatAuditTimestamp,
  toAuditLogErrorMessage,
} from "@/features/dashboard/admin/audit-log/utils";

function toQueryParams(
  params: AuditLogListParams | AuditLogExportParams,
): Record<string, string | number | undefined> {
  return {
    page: "page" in params ? params.page : undefined,
    limit: "limit" in params ? params.limit : undefined,
    actorId: params.actorId || undefined,
    actorEmail: params.actorEmail || undefined,
    entityType: params.entityType || undefined,
    action: params.action || undefined,
    method: params.method || undefined,
    source: params.source || undefined,
    outcome: params.outcome || undefined,
    status: params.status,
    search: params.search || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
  };
}

export async function fetchAuditLogList(
  params: AuditLogListParams = {},
): Promise<AuditLogListResult> {
  const res = await dashboardApi.get<Envelope<AuditLogListResult>>(
    "/admin/audit-log",
    {
      cache: "no-store",
      params: toQueryParams({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...params,
      }),
    },
  );
  return res.data;
}

export async function fetchAuditLogItem(
  id: string,
): Promise<AdminAuditLogItem> {
  const res = await dashboardApi.get<Envelope<AdminAuditLogItem>>(
    `/admin/audit-log/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  return res.data;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

export async function downloadAuditLogCsv(
  params: AuditLogExportParams = {},
): Promise<void> {
  const url = buildUrl("/admin/audit-log/export", toQueryParams(params));
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let message = res.statusText || "Export failed";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string") message = body.message;
    } catch {
      // non-JSON body
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const filename =
    filenameFromDisposition(res.headers.get("content-disposition")) ??
    "admin-audit-log.csv";
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

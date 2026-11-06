import { DashboardApiError } from "@/lib/api/dashboard";
import type { AdminAuditLogItem } from "@/features/dashboard/admin/audit-log/types/models";

export function toAuditLogErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function formatAuditTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function formatAuditDuration(value: number | null): string {
  if (value === null || value === undefined) return "-";
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function formatAuditActor(item: AdminAuditLogItem): string {
  return item.actorEmail ?? item.actorId ?? "System";
}

export function formatAuditEntity(item: AdminAuditLogItem): string {
  if (!item.entityType) return "-";
  return item.entityId ? `${item.entityType} / ${item.entityId}` : item.entityType;
}

export function formatAuditMetadata(metadata: unknown): string {
  if (metadata === null || metadata === undefined) return "-";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

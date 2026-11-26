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
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return formatted;
}

function auditDateBoundary(value: string, end: boolean): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, year, month, day] = match;
  const nextDay = Number(day) + (end ? 1 : 0);
  const timestamp = Date.UTC(Number(year), Number(month) - 1, nextDay, -6, 0, 0, 0) - (end ? 1 : 0);
  return new Date(timestamp).toISOString();
}

export function auditDateToIsoStart(value: string): string | undefined {
  return auditDateBoundary(value, false);
}

export function auditDateToIsoEnd(value: string): string | undefined {
  return auditDateBoundary(value, true);
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

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchAuditLogList } from "@/features/dashboard/admin/audit-log/api/audit-log";
import type {
  AuditLogListParams,
  AuditLogListResult,
} from "@/features/dashboard/admin/audit-log/types/models";

export const AUDIT_LOG_PAGE_SIZE = 20;

export type AuditLogFilters = {
  actorEmail: string;
  entityType: string;
  action: string;
  search: string;
  method: AuditLogListParams["method"] | "";
  source: AuditLogListParams["source"] | "";
  outcome: AuditLogListParams["outcome"] | "";
  from: string;
  to: string;
};

export const EMPTY_AUDIT_FILTERS: AuditLogFilters = {
  actorEmail: "",
  entityType: "",
  action: "",
  search: "",
  method: "",
  source: "",
  outcome: "",
  from: "",
  to: "",
};

function isDefaultFilters(filters: AuditLogFilters): boolean {
  return (Object.keys(EMPTY_AUDIT_FILTERS) as (keyof AuditLogFilters)[]).every(
    (key) => filters[key] === EMPTY_AUDIT_FILTERS[key],
  );
}

export function useAuditLogList({
  initialData,
  page,
  filters,
}: {
  initialData: AuditLogListResult;
  page: number;
  filters: AuditLogFilters;
}) {
  const query = useQuery({
    queryKey: ["admin-audit-log", page, filters],
    queryFn: () =>
      fetchAuditLogList({
        page,
        limit: AUDIT_LOG_PAGE_SIZE,
        actorEmail: filters.actorEmail || undefined,
        entityType: filters.entityType || undefined,
        action: filters.action || undefined,
        search: filters.search || undefined,
        method: filters.method || undefined,
        source: filters.source || undefined,
        outcome: filters.outcome || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
    initialData: page === 1 && isDefaultFilters(filters) ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

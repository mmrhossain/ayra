"use client";

import { useDeferredValue, useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  auditDateToIsoEnd,
  auditDateToIsoStart,
  downloadAuditLogCsv,
  formatAuditActor,
  formatAuditDuration,
  formatAuditEntity,
  formatAuditTimestamp,
  toAuditLogErrorMessage,
} from "@/features/dashboard/admin/audit-log/api/audit-log";
import { AuditLogDetailSheet } from "@/features/dashboard/admin/audit-log/components/audit-log-detail-sheet";
import {
  EMPTY_AUDIT_FILTERS,
  useAuditLogList,
  type AuditLogFilters,
} from "@/features/dashboard/admin/audit-log/hooks/use-audit-log-list";
import type {
  AdminAuditLogItem,
  AuditLogListResult,
  AuditLogMethod,
  AuditLogOutcome,
  AuditLogSource,
} from "@/features/dashboard/admin/audit-log/types/models";

const METHODS: AuditLogMethod[] = ["POST", "PUT", "PATCH", "DELETE"];
const SOURCES: AuditLogSource[] = ["APP", "STAFF", "AUTH", "SYSTEM"];
const OUTCOMES: AuditLogOutcome[] = ["SUCCESS", "FAILURE"];

function statusVariant(statusCode: number): StatusBadgeVariant {
  if (statusCode >= 500) return "danger";
  if (statusCode >= 400) return "warning";
  return "success";
}

export function AuditLogTable({
  initialData,
}: {
  initialData: AuditLogListResult;
}) {
  const [pageState, setPageState] = useState({
    key: "",
    page: initialData.pagination.page,
  });
  const [search, setSearch] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [method, setMethod] = useState<AuditLogMethod | "">("");
  const [source, setSource] = useState<AuditLogSource | "">("");
  const [outcome, setOutcome] = useState<AuditLogOutcome | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<AdminAuditLogItem | null>(null);
  const [isExporting, setExporting] = useState(false);

  const deferredSearch = useDeferredValue(search.trim());
  const deferredActor = useDeferredValue(actorEmail.trim());
  const deferredAction = useDeferredValue(action.trim());
  const deferredEntity = useDeferredValue(entityType.trim());

  const filters = ({
      search: deferredSearch,
      actorEmail: deferredActor,
      action: deferredAction,
      entityType: deferredEntity,
      method,
      source,
      outcome,
      from: auditDateToIsoStart(fromDate) ?? "",
      to: auditDateToIsoEnd(toDate) ?? "",
    }) satisfies AuditLogFilters;

  const filterKey = JSON.stringify(filters);
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number | ((current: number) => number)) => {
    setPageState((current) => {
      const basePage = current.key === filterKey ? current.page : 1;
      return {
        key: filterKey,
        page:
          typeof next === "function"
            ? (next as (value: number) => number)(basePage)
            : next,
      };
    });
  };

  const hasFilters = filterKey !== JSON.stringify(EMPTY_AUDIT_FILTERS);

  const { query, items, pagination } = useAuditLogList({
    initialData,
    page,
    filters,
  });

  const resetFilters = () => {
    setSearch("");
    setActorEmail("");
    setAction("");
    setEntityType("");
    setMethod("");
    setSource("");
    setOutcome("");
    setFromDate("");
    setToDate("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadAuditLogCsv({
        actorEmail: filters.actorEmail || undefined,
        entityType: filters.entityType || undefined,
        action: filters.action || undefined,
        search: filters.search || undefined,
        method: filters.method || undefined,
        source: filters.source || undefined,
        outcome: filters.outcome || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      toast.success("Audit log export started");
    } catch (err) {
      toast.error(toAuditLogErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <p className="text-sm whitespace-nowrap text-muted-foreground">
              {pagination.total} entries
            </p>
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Clear
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
          <div className="min-w-0 flex-1 overflow-x-auto pb-1">
            <div className="flex w-max min-w-full items-center gap-2">
          <div className="relative w-64 shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search path, action, entity or request ID"
              aria-label="Search audit logs"
              className="pl-9"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Select
              value={method || "__all__"}
              onValueChange={(value) =>
                setMethod(value === "__all__" ? "" : (value as AuditLogMethod))
              }
            >
              <SelectTrigger
                className="w-36"
                size="sm"
                aria-label="Filter by HTTP method"
              >
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All methods</SelectItem>
                {METHODS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={outcome || "__all__"}
              onValueChange={(value) =>
                setOutcome(value === "__all__" ? "" : (value as AuditLogOutcome))
              }
            >
              <SelectTrigger
                className="w-32"
                size="sm"
                aria-label="Filter by outcome"
              >
                <SelectValue placeholder="All outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All outcomes</SelectItem>
                {OUTCOMES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={source || "__all__"}
              onValueChange={(value) =>
                setSource(value === "__all__" ? "" : (value as AuditLogSource))
              }
            >
              <SelectTrigger
                className="w-32"
                size="sm"
                aria-label="Filter by source"
              >
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All sources</SelectItem>
                {SOURCES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            value={actorEmail}
            onChange={(event) => setActorEmail(event.target.value)}
            placeholder="Actor email"
            aria-label="Filter audit logs by actor email"
            className="h-9 w-40 shrink-0"
          />
          <Input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="Action"
            aria-label="Filter audit logs by action"
            className="h-9 w-36 shrink-0"
          />
          <Input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="Entity type"
            aria-label="Filter audit logs by entity type"
            className="h-9 w-36 shrink-0"
          />
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="From date"
            className="h-9 w-40 shrink-0"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="To date"
            className="h-9 w-40 shrink-0"
          />
            </div>
          </div>
        </div>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toAuditLogErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="hidden min-w-0 rounded-xl border lg:block">
        {query.isFetching && !query.isFetched && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No audit log entries found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatAuditTimestamp(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatAuditActor(item)}
                        </span>
                        {item.actorRole ? (
                          <span className="text-xs text-muted-foreground">
                            {item.actorRole}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[320px] flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                            {item.method}
                          </span>
                          <span className="truncate text-xs">
                            {item.action ?? "-"}
                          </span>
                        </div>
                        <span
                          className="truncate text-xs text-muted-foreground"
                          title={item.path}
                        >
                          {item.path}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span
                        className="block truncate text-sm"
                        title={formatAuditEntity(item)}
                      >
                        {formatAuditEntity(item)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge variant={statusVariant(item.statusCode)}>
                          {item.statusCode}
                        </StatusBadge>
                        {item.outcome === "FAILURE" ? (
                          <StatusBadge variant="danger">FAILED</StatusBadge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      {formatAuditDuration(item.durationMs)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(item)}
                        aria-label={`View audit entry ${item.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3 lg:hidden">
        {query.isFetching && !query.isFetched && items.length === 0 ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            No audit log entries found.
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="min-w-0 space-y-3 rounded-xl border bg-card p-3 shadow-sm sm:p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{formatAuditTimestamp(item.createdAt)}</p>
                  <p className="mt-1 break-words text-sm font-semibold">{formatAuditActor(item)}</p>
                  {item.actorRole ? <p className="text-xs text-muted-foreground">{item.actorRole}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelected(item)}
                  aria-label={`View audit entry ${item.id}`}
                >
                  View
                </Button>
              </div>

              <div className="min-w-0 space-y-1 border-t pt-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="w-fit shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                    {item.method}
                  </span>
                  <span className="min-w-0 break-words text-sm font-medium">{item.action ?? "-"}</span>
                </div>
                <p className="break-all font-mono text-xs text-muted-foreground">{item.path}</p>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 border-t pt-3 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Entity</p>
                  <p className="mt-1 break-words">{formatAuditEntity(item)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StatusBadge variant={statusVariant(item.statusCode)}>{item.statusCode}</StatusBadge>
                    {item.outcome === "FAILURE" ? <StatusBadge variant="danger">FAILED</StatusBadge> : null}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="mt-1 tabular-nums">{formatAuditDuration(item.durationMs)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="mt-1 break-words">{item.source}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <span className="sm:inline">Previous</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() =>
              setPage((current) =>
                Math.min(Math.max(pagination.totalPages, 1), current + 1),
              )
            }
          >
            <span className="sm:inline">Next</span>
          </Button>
        </div>
      </div>

      <AuditLogDetailSheet
        item={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}

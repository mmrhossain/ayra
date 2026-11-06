"use client";

import { useMemo, useState } from "react";
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
import { useDebouncedValue } from "@/features/dashboard/admin/shared/hooks/use-debounced-value";
import { dateToIsoEnd, dateToIsoStart } from "@/lib/format";

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

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const debouncedActor = useDebouncedValue(actorEmail.trim(), 300);
  const debouncedAction = useDebouncedValue(action.trim(), 300);
  const debouncedEntity = useDebouncedValue(entityType.trim(), 300);

  const filters = useMemo<AuditLogFilters>(
    () => ({
      search: debouncedSearch,
      actorEmail: debouncedActor,
      action: debouncedAction,
      entityType: debouncedEntity,
      method,
      source,
      outcome,
      from: dateToIsoStart(fromDate) ?? "",
      to: dateToIsoEnd(toDate) ?? "",
    }),
    [
      debouncedSearch,
      debouncedActor,
      debouncedAction,
      debouncedEntity,
      method,
      source,
      outcome,
      fromDate,
      toDate,
    ],
  );

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
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search path, action, entity or request ID"
              aria-label="Search audit logs"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center gap-2 lg:ml-auto">
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
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            value={actorEmail}
            onChange={(event) => setActorEmail(event.target.value)}
            placeholder="Actor email"
            aria-label="Filter audit logs by actor email"
            className="h-9"
          />
          <Input
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="Action"
            aria-label="Filter audit logs by action"
            className="h-9"
          />
          <Input
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="Entity type"
            aria-label="Filter audit logs by entity type"
            className="h-9"
          />
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="From date"
            className="h-9"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="To date"
            className="h-9"
          />
        </div>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toAuditLogErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() =>
              setPage((current) =>
                Math.min(Math.max(pagination.totalPages, 1), current + 1),
              )
            }
          >
            Next
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

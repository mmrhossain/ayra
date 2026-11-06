"use client";

import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatAuditActor,
  formatAuditDuration,
  formatAuditEntity,
  formatAuditMetadata,
  formatAuditTimestamp,
} from "@/features/dashboard/admin/audit-log/api/audit-log";
import type { AdminAuditLogItem } from "@/features/dashboard/admin/audit-log/types/models";

function statusVariant(statusCode: number) {
  if (statusCode >= 500) return "danger" as const;
  if (statusCode >= 400) return "warning" as const;
  return "success" as const;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function AuditLogDetailSheet({
  item,
  open,
  onOpenChange,
}: {
  item: AdminAuditLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Audit entry</SheetTitle>
          <SheetDescription>
            {item ? formatAuditTimestamp(item.createdAt) : "Event details"}
          </SheetDescription>
        </SheetHeader>

        {item ? (
          <div className="space-y-4 px-4 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                {item.method}
              </span>
              <StatusBadge variant={statusVariant(item.statusCode)}>
                {item.statusCode}
              </StatusBadge>
              <StatusBadge variant={item.outcome === "FAILURE" ? "danger" : "success"}>
                {item.outcome}
              </StatusBadge>
              <StatusBadge variant="neutral">{item.source}</StatusBadge>
            </div>

            <dl className="divide-y rounded-xl border px-4 py-1">
              <Field label="Actor">{formatAuditActor(item)}</Field>
              <Field label="Role">{item.actorRole ?? "-"}</Field>
              <Field label="Action">{item.action ?? "-"}</Field>
              <Field label="Path">
                <span className="font-mono text-xs break-all">{item.path}</span>
              </Field>
              <Field label="Entity">{formatAuditEntity(item)}</Field>
              <Field label="Duration">
                {formatAuditDuration(item.durationMs)}
              </Field>
              <Field label="Request ID">
                <span className="font-mono text-xs break-all">
                  {item.requestId ?? "-"}
                </span>
              </Field>
              <Field label="IP">{item.ip ?? "-"}</Field>
              <Field label="User agent">
                <span className="text-xs break-words">{item.userAgent ?? "-"}</span>
              </Field>
            </dl>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Metadata</h3>
              <pre className="max-h-80 overflow-auto rounded-xl border bg-muted/40 p-3 text-xs">
                {formatAuditMetadata(item.metadata)}
              </pre>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

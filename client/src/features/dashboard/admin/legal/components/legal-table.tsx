"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LegalPublishDialog } from "@/features/dashboard/admin/legal/components/legal-publish-dialog";
import { LegalFormDialog } from "@/features/dashboard/admin/legal/components/legal.dialog";
import { useLegalList } from "@/features/dashboard/admin/legal/hooks/use-legal-list";
import type {
  DialogMode,
  LegalDocumentItem,
  LegalTableProps,
} from "@/features/dashboard/admin/legal/types";
import {
  legalTypeLabel,
  toLegalErrorMessage,
} from "@/features/dashboard/admin/legal/utils";
import { EmptyState } from "@/features/dashboard/admin/shared/components/empty-state";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";

export function LegalTable({ initialData, type }: LegalTableProps) {
  const [page, setPage] = useState(initialData?.meta?.page ?? 1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DialogMode>("create");
  const [editing, setEditing] = useState<LegalDocumentItem | undefined>();
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState<LegalDocumentItem | null>(null);

  const { query, items, pagination } = useLegalList({
    initialData,
    page,
    type,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination?.total} documents
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Add Document
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toLegalErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      title="No legal documents"
                      body="Add a privacy policy or terms of service document."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell data-label="Type">
                      {legalTypeLabel(doc.type)}
                    </TableCell>
                    <TableCell className="font-medium" data-label="Title">
                      {doc.title}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Version"
                    >
                      {doc.version}
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge
                        variant={
                          doc.status === "PUBLISHED"
                            ? "success"
                            : doc.status === "ARCHIVED"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {doc.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      data-label="Effective"
                    >
                      {doc.effectiveAt
                        ? new Date(doc.effectiveAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === "DRAFT" ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormMode("edit");
                                setEditing(doc);
                                setFormOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setPublishing(doc);
                                setPublishOpen(true);
                              }}
                            >
                              Publish
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormMode("edit");
                              setEditing(doc);
                              setFormOpen(true);
                            }}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </ResponsiveTable>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {pagination?.page} of {Math.max(pagination?.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination?.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <LegalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formMode === "edit" ? editing : undefined}
      />
      <LegalPublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        document={publishing}
      />
    </div>
  );
}

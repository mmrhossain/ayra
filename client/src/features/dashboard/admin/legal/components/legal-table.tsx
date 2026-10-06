"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LegalPublishDialog } from "@/features/dashboard/admin/legal/components/legal-publish-dialog";
import { LegalFormDialog } from "@/features/dashboard/admin/legal/components/legal.dialog";
import { useLegalList } from "@/features/dashboard/admin/legal/hooks/use-legal-list";
import {
  LEGAL_TYPES,
  type DialogMode,
  type LegalDocumentItem,
  type LegalTableProps,
  type LegalType,
} from "@/features/dashboard/admin/legal/types";
import { legalTypeLabel, toLegalErrorMessage } from "@/features/dashboard/admin/legal/utils";

export function LegalTable({ initialData }: LegalTableProps) {
  const [page, setPage] = useState(initialData?.meta?.page);
  const [type, setType] = useState<LegalType | "">("");
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
        <Select
          value={type || "__all__"}
          onValueChange={(v) => {
            setType(v === "__all__" ? "" : (v as LegalType));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {LEGAL_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {legalTypeLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{pagination?.total} documents</p>
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
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
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
          <Table>
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No legal documents.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{legalTypeLabel(doc.type)}</TableCell>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.version}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${
                          doc.status === "PUBLISHED"
                            ? "bg-primary text-primary-foreground"
                            : doc.status === "ARCHIVED"
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.effectiveAt ? new Date(doc.effectiveAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
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
          </Table>
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
      <LegalPublishDialog open={publishOpen} onOpenChange={setPublishOpen} document={publishing} />
    </div>
  );
}

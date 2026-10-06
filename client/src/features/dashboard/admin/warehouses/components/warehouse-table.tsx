"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarehouseDeleteDialog } from "@/features/dashboard/admin/warehouses/components/warehouse-delete-dialog";
import { WarehouseFormDialog } from "@/features/dashboard/admin/warehouses/components/warehouse-dialog";
import { useWarehouseList } from "@/features/dashboard/admin/warehouses/hooks/use-warehouse-list";
import type {
  DialogMode,
  WarehouseListItem,
  WarehouseTableProps,
} from "@/features/dashboard/admin/warehouses/types";
import { toWarehouseErrorMessage } from "@/features/dashboard/admin/warehouses/utils";

export function WarehouseTable({ initialData }: WarehouseTableProps) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DialogMode>("create");
  const [editing, setEditing] = useState<WarehouseListItem | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<WarehouseListItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const { query, items, pagination } = useWarehouseList({
    initialData,
    page,
    search,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or code"
          aria-label="Search warehouses by name or code"
          className="max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {pagination.total} warehouses
          </p>
          <Button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            Add Warehouse
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toWarehouseErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No warehouses found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">
                      {warehouse.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {warehouse.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[warehouse.city, warehouse.state, warehouse.country]
                        .filter(Boolean)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {warehouse.phone || warehouse.email || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${
                          warehouse.isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {warehouse.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormMode("edit");
                            setEditing(warehouse);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleting(warehouse);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
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
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
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
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <WarehouseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formMode === "edit" ? editing : undefined}
      />
      <WarehouseDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        warehouse={deleting}
      />
    </div>
  );
}

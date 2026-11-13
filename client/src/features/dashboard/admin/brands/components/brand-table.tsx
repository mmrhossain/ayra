"use client";

import Image from "next/image";
import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import {
  toBrandErrorMessage,
  type BrandListItem,
  type BrandListResult,
} from "@/features/dashboard/admin/brands/api/brands";
import { BrandDeleteDialog } from "@/features/dashboard/admin/brands/components/brand-delete-dialog";
import { BrandFormDialog } from "@/features/dashboard/admin/brands/components/brand.dialog";
import { useBrandList } from "@/features/dashboard/admin/brands/hooks/use-brand-list";
import { statusColor } from "@/helpers";

type Props = {
  initialData: BrandListResult;
};

export function BrandTable({ initialData }: Props) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput.trim());

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingBrand, setEditingBrand] = useState<BrandListItem | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState<BrandListItem | null>(null);

  const { query, items, pagination } = useBrandList({
    initialData,
    page,
    search: deferredSearch,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleOpenCreateModal = () => {
    setFormMode("create");
    setEditingBrand(undefined);
    setFormOpen(true);
  };

  const handleOpenEditModal = (brand: BrandListItem) => {
    setFormMode("edit");
    setEditingBrand(brand);
    setFormOpen(true);
  };

  const handleOpenDeleteModal = (brand: BrandListItem) => {
    setDeletingBrand(brand);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search brands..."
          aria-label="Search brands"
          className="max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{pagination.total} brands</p>
          <Button type="button" onClick={handleOpenCreateModal}>
            Add Brand
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"
        >
          <p className="text-sm font-medium">{toBrandErrorMessage(query.error)}</p>
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
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No brands found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((brand) => {
                  const statusString = brand.isActive ? "active" : "inactive";

                  return (
                    <TableRow key={brand.id}>
                      <TableCell data-label="Logo">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted sm:size-12">
                          <Image
                            src={brand.logo || "https://placehold.jp/80x80.png"}
                            alt={brand.name}
                            fill
                            sizes="(max-width: 640px) 40px, 48px"
                            className="object-cover"
                            unoptimized={!brand.logo}
                          />
                        </div>
                      </TableCell>
                      <TableCell data-label="Name" className="font-medium">{brand.name}</TableCell>
                      <TableCell data-label="Slug" className="text-muted-foreground">{brand.slug}</TableCell>
                      <TableCell data-label="Status">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(
                            statusString
                          )}`}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell data-label="Actions" className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(brand)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(brand)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </ResponsiveTable>
        )}
      </div>

      <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
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
      </nav>

      <BrandFormDialog
        key={formOpen ? `${formMode}-${editingBrand?.id ?? "new"}` : "form-closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBrand(undefined);
        }}
        mode={formMode}
        initialData={formMode === "edit" ? editingBrand : undefined}
      />

      <BrandDeleteDialog
        key={deleteOpen ? (deletingBrand?.id ?? "delete") : "delete-closed"}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingBrand(null);
        }}
        brand={deletingBrand}
      />
    </div>
  );
}

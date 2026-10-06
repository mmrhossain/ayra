"use client";

import Image from "next/image";
import { useDeferredValue, useState } from "react";

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
import {
  toCategoryErrorMessage,
  type CategoryListItem,
  type CategoryListResult,
} from "@/features/dashboard/admin/categories/api/categories";
import { CategoryDeleteDialog } from "@/features/dashboard/admin/categories/components/category-delete-dialog";
import { CategoryFormDialog } from "@/features/dashboard/admin/categories/components/category.dialog";
import { useCategoryList } from "@/features/dashboard/admin/categories/hooks/use-category-list";
import { statusColor } from "@/helpers";

type Props = {
  initialData: CategoryListResult;
};

export function CategoryTable({ initialData }: Props) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState("");

  // React Deferred Value: useEffect ছাড়াই স্মুথ ও নন-ব্লকিং ডিবাউন্সড সার্চ
  const deferredSearch = useDeferredValue(searchInput.trim());

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryListItem | null>(null);

  // ডিফারড সার্চ ভ্যালু দিয়ে ক্যাটাগরি লিস্ট ফেচ করা
  const { query, items, pagination, parentOptions } = useCategoryList({
    initialData,
    page,
    search: deferredSearch,
  });

  // সার্চ ইনপুট পরিবর্তনের সাথে সাথে পেজ ১-এ রিসেট করা
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleOpenCreateModal = () => {
    setFormMode("create");
    setEditingCategory(undefined);
    setFormOpen(true);
  };

  const handleOpenEditModal = (category: CategoryListItem) => {
    setFormMode("edit");
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleOpenDeleteModal = (category: CategoryListItem) => {
    setDeletingCategory(category);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search categories..."
          aria-label="Search categories"
          className="max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{pagination.total} categories</p>
          <Button type="button" onClick={handleOpenCreateModal}>
            Add Category
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"
        >
          <p className="text-sm font-medium">{toCategoryErrorMessage(query.error)}</p>
        </div>
      ) : null}

      {/* Category Table */}
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
                <TableHead className="w-[100px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Children</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((category) => {
                  const statusString = category.isActive ? "active" : "inactive";

                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Image
                          src={category.image || "https://placehold.jp/160x96.png"}
                          alt={category.name}
                          width={80}
                          height={48}
                          className="h-12 w-20 rounded-md object-cover"
                          unoptimized={!category.image}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.parentName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(
                            statusString
                          )}`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {category.childrenCount ?? category.children?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(category)}
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
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
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

      <CategoryFormDialog
        key={formOpen ? `${formMode}-${editingCategory?.id ?? "new"}` : "form-closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCategory(undefined);
        }}
        mode={formMode}
        initialData={formMode === "edit" ? editingCategory : undefined}
        categories={parentOptions}
      />

      <CategoryDeleteDialog
        key={deleteOpen ? (deletingCategory?.id ?? "delete") : "delete-closed"}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingCategory(null);
        }}
        category={deletingCategory}
      />
    </div>
  );
}

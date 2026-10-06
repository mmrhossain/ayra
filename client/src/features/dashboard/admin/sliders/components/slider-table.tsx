"use client";

import { useEffect, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SliderDeleteDialog } from "@/features/dashboard/admin/sliders/components/slider-delete-dialog";
import { SliderFormDialog } from "@/features/dashboard/admin/sliders/components/slider.dialog";
import { useSliderList } from "@/features/dashboard/admin/sliders/hooks/use-slider-list";
import type {
  DialogMode,
  SliderListItem,
  SliderTableProps,
} from "@/features/dashboard/admin/sliders/types";
import { toSliderErrorMessage } from "@/features/dashboard/admin/sliders/utils";
import { formatDate } from "@/lib/format";
import Image from "next/image";

// const PAGE_SIZE = 20;

export function SliderTable({ initialData }: SliderTableProps) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [titleInput, setTitleInput] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DialogMode>("create");
  const [editingSlider, setEditingSlider] = useState<SliderListItem | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSlider, setDeletingSlider] = useState<SliderListItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTitle(titleInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [titleInput]);

  const { query, items, pagination } = useSliderList({
    initialData,
    page,
    title,
    status,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Search by title"
            aria-label="Search sliders by title"
            className="max-w-sm"
          />
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as "all" | "true" | "false");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{pagination.total} sliders</p>
          <Button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditingSlider(undefined);
              setFormOpen(true);
            }}
          >
            Add Slider
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toSliderErrorMessage(query.error)}</p>
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
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No sliders found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((slider) => (
                  <TableRow key={slider.id}>
                    <TableCell>
                      <Image
                        src={slider.imageUrl || "https://placehold.jp/160x96.png"}
                        alt={slider.title}
                        className="h-12 w-20 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{slider.title}</p>
                      {slider.redirectUrl ? (
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {slider.redirectUrl}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="tabular-nums">{slider.priority}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(slider.startDate)} – {formatDate(slider.endDate)}
                    </TableCell>
                    <TableCell>{slider.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormMode("edit");
                            setEditingSlider(slider);
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
                            setDeletingSlider(slider);
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

      <SliderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formMode === "edit" ? editingSlider : undefined}
      />
      <SliderDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} slider={deletingSlider} />
    </div>
  );
}

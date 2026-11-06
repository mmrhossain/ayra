"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCategoryList,
  flattenCategories,
} from "@/features/dashboard/admin/categories/api/categories";
import { useProductBulkMutation } from "@/features/dashboard/admin/products/hooks/use-product-bulk";
import type { BulkProductAction } from "@/features/dashboard/admin/products/types";

export type BulkActionBarProps = {
  ids: string[];
  onClear: () => void;
};

export function BulkActionBar({ ids, onClear }: BulkActionBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories", "options"],
    queryFn: () => fetchCategoryList(),
    staleTime: 60_000,
  });
  const categories = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data]
  );
  const mutation = useProductBulkMutation({
    onSuccess: () => {
      setConfirmOpen(false);
      setCategoryOpen(false);
      setCategoryId("");
      onClear();
    },
  });
  const count = ids.length;
  const pending = mutation.isPending;

  if (count === 0) return null;

  const run = (action: BulkProductAction) => mutation.mutate(action);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
      <p className="text-sm font-medium">{count} selected</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run({ type: "set-status", ids, status: "ACTIVE" })}
        >
          Activate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run({ type: "set-status", ids, status: "DRAFT" })}
        >
          Set draft
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run({ type: "set-featured", ids, isFeatured: true })}
        >
          Feature
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run({ type: "set-featured", ids, isFeatured: false })}
        >
          Unfeature
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setCategoryOpen(true)}
        >
          Set category
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={onClear}
      >
        Clear
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {count} product(s)</DialogTitle>
            <DialogDescription>
              This cannot be undone. Products with recent orders are still
              soft-deleted and recoverable from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => run({ type: "delete", ids })}
            >
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move {count} product(s)</DialogTitle>
            <DialogDescription>
              Select the category every chosen product should belong to.
            </DialogDescription>
          </DialogHeader>
          <Select value={categoryId || undefined} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {`${"\u2014 ".repeat(category.depth)}${category.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !categoryId}
              onClick={() => run({ type: "set-category", ids, categoryId })}
            >
              {pending ? "Saving..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

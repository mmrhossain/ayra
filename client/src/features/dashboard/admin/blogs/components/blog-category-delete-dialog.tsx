"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBlogCategoryDeleteMutation } from "@/features/dashboard/admin/blogs/hooks/use-blog-mutations";
import type { BlogCategoryDeleteDialogProps } from "@/features/dashboard/admin/blogs/types";

export type { BlogCategoryDeleteDialogProps };

export function BlogCategoryDeleteDialog({
  open,
  onOpenChange,
  category,
}: BlogCategoryDeleteDialogProps) {
  const mutation = useBlogCategoryDeleteMutation({
    category,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete blog category</DialogTitle>
          <DialogDescription>
            {category
              ? `Delete "${category.name}"? Remove its posts first.`
              : "Delete this category?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!category || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useBlogDeleteMutation } from "@/features/dashboard/admin/blogs/hooks/use-blog-mutations";
import type { BlogDeleteDialogProps } from "@/features/dashboard/admin/blogs/types";

export type { BlogDeleteDialogProps };

export function BlogDeleteDialog({
  open,
  onOpenChange,
  post,
}: BlogDeleteDialogProps) {
  const mutation = useBlogDeleteMutation({
    post,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete blog post</DialogTitle>
          <DialogDescription>
            {post
              ? `Delete "${post.title}"? It will be hidden from the storefront.`
              : "Delete this post?"}
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
            disabled={!post || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

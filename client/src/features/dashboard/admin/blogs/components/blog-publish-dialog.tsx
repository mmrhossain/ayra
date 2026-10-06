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
import { useBlogPublishMutation } from "@/features/dashboard/admin/blogs/hooks/use-blog-mutations";
import type { BlogPublishDialogProps } from "@/features/dashboard/admin/blogs/types";

export type { BlogPublishDialogProps };

export function BlogPublishDialog({
  open,
  onOpenChange,
  post,
}: BlogPublishDialogProps) {
  const mutation = useBlogPublishMutation({
    post,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Publish post</DialogTitle>
          <DialogDescription>
            {post
              ? `Publish "${post.title}"? It will appear on the storefront.`
              : "Publish this post?"}
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
            disabled={!post || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

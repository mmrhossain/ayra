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
import { useFaqItemDeleteMutation } from "@/features/dashboard/admin/faqs/hooks/use-faq-mutations";
import type { FaqItemDeleteDialogProps } from "@/features/dashboard/admin/faqs/types";

export type { FaqItemDeleteDialogProps };

export function FaqItemDeleteDialog({
  open,
  onOpenChange,
  item,
}: FaqItemDeleteDialogProps) {
  const mutation = useFaqItemDeleteMutation({
    item,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete FAQ</DialogTitle>
          <DialogDescription>
            {item
              ? `Delete "${item.question}"? This cannot be undone.`
              : "Delete this FAQ?"}
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
            disabled={!item || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useAttributeDeleteMutation } from "@/features/dashboard/admin/attributes/hooks/use-attribute-mutations";
import type { AttributeDeleteDialogProps } from "@/features/dashboard/admin/attributes/types";

export type { AttributeDeleteDialogProps };

export function AttributeDeleteDialog({
  open,
  onOpenChange,
  attribute,
}: AttributeDeleteDialogProps) {
  const mutation = useAttributeDeleteMutation({
    attribute,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete attribute</DialogTitle>
          <DialogDescription>
            {attribute
              ? `Delete "${attribute.name}" and its values? This cannot be undone.`
              : "Delete this attribute?"}
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
            disabled={!attribute || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

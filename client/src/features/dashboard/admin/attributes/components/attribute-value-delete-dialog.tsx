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
import { useAttributeValueDeleteMutation } from "@/features/dashboard/admin/attributes/hooks/use-attribute-mutations";
import type { AttributeValueDeleteDialogProps } from "@/features/dashboard/admin/attributes/types";

export type { AttributeValueDeleteDialogProps };

export function AttributeValueDeleteDialog({
  open,
  onOpenChange,
  value,
}: AttributeValueDeleteDialogProps) {
  const mutation = useAttributeValueDeleteMutation({
    value,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete value</DialogTitle>
          <DialogDescription>
            {value
              ? `Delete "${value.value}"? This cannot be undone.`
              : "Delete this value?"}
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
            disabled={!value || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

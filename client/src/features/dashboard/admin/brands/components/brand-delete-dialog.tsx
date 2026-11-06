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
import { useBrandDeleteMutation } from "@/features/dashboard/admin/brands/hooks/use-brand-mutations";
import type { BrandDeleteDialogProps } from "@/features/dashboard/admin/brands/types";

export type { BrandDeleteDialogProps };

export function BrandDeleteDialog({
  open,
  onOpenChange,
  brand,
}: BrandDeleteDialogProps) {
  const mutation = useBrandDeleteMutation({
    brand,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete brand</DialogTitle>
          <DialogDescription>
            {brand
              ? `Delete "${brand.name}"? This cannot be undone.`
              : "Delete this brand?"}
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
            disabled={!brand || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

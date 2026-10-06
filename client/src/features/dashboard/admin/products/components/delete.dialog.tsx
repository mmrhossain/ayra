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
import { useProductDeleteMutation } from "@/features/dashboard/admin/products/hooks/use-product-delete";
import type { ProductDeleteDialogProps } from "@/features/dashboard/admin/products/types";

export type { ProductDeleteDialogProps };

export function DeleteDialog({
  open,
  onOpenChange,
  product,
}: ProductDeleteDialogProps) {
  const mutation = useProductDeleteMutation({
    product,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete product</DialogTitle>
          <DialogDescription>
            {product
              ? `Delete "${product.name}"? This cannot be undone.`
              : "Delete this product?"}
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
            disabled={!product || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useWarehouseDeleteMutation } from "@/features/dashboard/admin/warehouses/hooks/use-warehouse-mutations";
import type { WarehouseDeleteDialogProps } from "@/features/dashboard/admin/warehouses/types";

export type { WarehouseDeleteDialogProps };

export function WarehouseDeleteDialog({
  open,
  onOpenChange,
  warehouse,
}: WarehouseDeleteDialogProps) {
  const mutation = useWarehouseDeleteMutation({
    warehouse,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete warehouse</DialogTitle>
          <DialogDescription>
            {warehouse
              ? `Deactivate and remove "${warehouse.name}" (${warehouse.code})?`
              : "Delete this warehouse?"}
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
            disabled={!warehouse || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

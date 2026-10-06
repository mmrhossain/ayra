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
import { useShippingZoneDeleteMutation } from "@/features/dashboard/admin/shipping/hooks/use-shipping-mutations";
import type { ZoneDeleteDialogProps } from "@/features/dashboard/admin/shipping/types";

export type { ZoneDeleteDialogProps };

export function ZoneDeleteDialog({ open, onOpenChange, zone }: ZoneDeleteDialogProps) {
  const mutation = useShippingZoneDeleteMutation({
    zone,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete zone</DialogTitle>
          <DialogDescription>
            {zone ? `Delete "${zone.name}" and its rates?` : "Delete this shipping zone?"}
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
            disabled={!zone || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

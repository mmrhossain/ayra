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
import { useShippingRateDeleteMutation } from "@/features/dashboard/admin/shipping/hooks/use-shipping-mutations";
import type { RateDeleteDialogProps } from "@/features/dashboard/admin/shipping/types";

export type { RateDeleteDialogProps };

export function RateDeleteDialog({ open, onOpenChange, rate }: RateDeleteDialogProps) {
  const mutation = useShippingRateDeleteMutation({
    rate,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete rate</DialogTitle>
          <DialogDescription>
            {rate
              ? `Delete the rate for ${rate.shippingZone?.name ?? "this zone"} / ${rate.shippingMethod?.name ?? "this method"}?`
              : "Delete this shipping rate?"}
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
            disabled={!rate || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

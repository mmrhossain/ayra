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
import { useCouponDeleteMutation } from "@/features/dashboard/admin/coupons/hooks/use-coupon-mutations";
import type { CouponDeleteDialogProps } from "@/features/dashboard/admin/coupons/types";

export type { CouponDeleteDialogProps };

export function CouponDeleteDialog({
  open,
  onOpenChange,
  coupon,
}: CouponDeleteDialogProps) {
  const mutation = useCouponDeleteMutation({
    coupon,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete coupon</DialogTitle>
          <DialogDescription>
            {coupon
              ? `Delete "${coupon.code}"? This cannot be undone.`
              : "Delete this coupon?"}
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
            disabled={!coupon || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

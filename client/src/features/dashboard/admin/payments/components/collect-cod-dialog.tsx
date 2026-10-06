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
import { money } from "@/features/dashboard/admin/orders/api/orders";
import { useCollectCodMutation } from "@/features/dashboard/admin/payments/hooks/use-payment-mutations";
import type { CollectCodDialogProps } from "@/features/dashboard/admin/payments/types";

export type { CollectCodDialogProps };

export function CollectCodDialog({ open, onOpenChange, payment }: CollectCodDialogProps) {
  const mutation = useCollectCodMutation({
    payment,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Collect COD payment</DialogTitle>
          <DialogDescription>
            {payment
              ? `Mark ${money(payment.amount)} as collected? This confirms the order as paid.`
              : "Collect this COD payment?"}
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
            disabled={!payment || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Collecting…" : "Collect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

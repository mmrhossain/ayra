"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/features/dashboard/admin/orders/api/orders";
import { useUpdateRefundStatusMutation } from "@/features/dashboard/admin/payments/hooks/use-payment-mutations";
import type { RefundQueueItem } from "@/features/dashboard/admin/payments/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refund: RefundQueueItem | null;
};

export function CompleteRefundDialog({ open, onOpenChange, refund }: Props) {
  const [providerReference, setProviderReference] = useState("");
  const mutation = useUpdateRefundStatusMutation();


  function submit() {
    if (!refund) return;

    const reference = providerReference.trim();
    mutation.mutate(
      {
        refundId: refund.id,
        status: "COMPLETED",
        ...(reference ? { providerReference: reference } : {}),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete refund</DialogTitle>
          <DialogDescription>
            {refund
              ? `${money(refund.amount)} for ${refund.payment.order?.orderNumber ?? "order"}`
              : "Mark this refund as completed."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="refund-provider-reference">
            Provider reference (optional)
          </Label>
          <Input
            id="refund-provider-reference"
            value={providerReference}
            onChange={(event) => setProviderReference(event.target.value)}
            placeholder="Bank or gateway transaction id"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Add this after the money has actually left your account.
          </p>
        </div>

        <DialogFooter>
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
            onClick={submit}
            disabled={mutation.isPending || !refund}
          >
            {mutation.isPending ? "Completing..." : "Mark completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

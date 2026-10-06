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
import { Textarea } from "@/components/ui/textarea";
import type { AdminReturnRequest } from "@/features/dashboard/admin/orders/api/orders";
import { useReturnReviewMutation } from "@/features/dashboard/admin/orders/hooks/use-return-review";

export type ReturnReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdminReturnRequest | null;
  status: "APPROVED" | "REJECTED";
};

export function ReturnReviewDialog({
  open,
  onOpenChange,
  request,
  status,
}: ReturnReviewDialogProps) {
  const [adminNote, setAdminNote] = useState("");
  const action = status === "APPROVED" ? "Approve" : "Reject";
  const mutation = useReturnReviewMutation({
    request,
    status,
    onSuccess: () => {
      setAdminNote("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setAdminNote("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action} return</DialogTitle>
          <DialogDescription>
            {request
              ? `${action} return for order ${request.order?.orderNumber ?? request.orderId}?`
              : `${action} this return request?`}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Admin note (optional)"
          aria-label="Admin note"
        />
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
            variant={status === "REJECTED" ? "destructive" : "default"}
            disabled={!request || mutation.isPending}
            onClick={() => mutation.mutate(adminNote)}
          >
            {mutation.isPending ? `${action.slice(0, -1)}ing...` : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

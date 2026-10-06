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
import {
  reviewCustomerLabel,
  type AdminReviewItem,
} from "@/features/dashboard/admin/reviews/api/reviews";
import { useReviewRejectMutation } from "@/features/dashboard/admin/reviews/hooks/use-review-mutations";

export type ReviewRejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export function ReviewRejectDialog({
  open,
  onOpenChange,
  review,
}: ReviewRejectDialogProps) {
  const [reason, setReason] = useState("");
  const mutation = useReviewRejectMutation({
    review,
    onSuccess: () => {
      setReason("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject review</DialogTitle>
          <DialogDescription>
            {review
              ? `Reject the ${review.rating}-star review by ${reviewCustomerLabel(review)} on ${review.product?.name ?? "this product"}?`
              : "Reject this review?"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="rejection-reason" className="text-sm font-medium">
            Reason (optional)
          </label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Why is this review being rejected?"
            disabled={mutation.isPending}
          />
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
            variant="destructive"
            disabled={!review || mutation.isPending}
            onClick={() => mutation.mutate(reason)}
          >
            {mutation.isPending ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

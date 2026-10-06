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
import {
  reviewCustomerLabel,
  type AdminReviewItem,
} from "@/features/dashboard/admin/reviews/api/reviews";

export type ReviewViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export function ReviewViewDialog({
  open,
  onOpenChange,
  review,
}: ReviewViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review</DialogTitle>
          <DialogDescription>
            {review
              ? `${review.product?.name ?? "Product"} · ${reviewCustomerLabel(review)} · ${review.rating}/5`
              : "Review details"}
          </DialogDescription>
        </DialogHeader>
        {review ? (
          <div className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">
              {review.comment?.trim() || "No comment."}
            </p>
            <p className="text-muted-foreground">
              {review.verifiedPurchase ? "Verified purchase" : "Unverified"} ·{" "}
              {review.isApproved
                ? "Approved"
                : review.rejectionReason
                  ? "Rejected"
                  : "Pending"}{" "}
              · {new Date(review.createdAt).toLocaleString()}
            </p>
            {review.rejectionReason ? (
              <p className="text-sm">
                <span className="font-medium">Rejection reason: </span>
                {review.rejectionReason}
              </p>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

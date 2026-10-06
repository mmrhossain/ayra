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
import { useReviewApproveMutation } from "@/features/dashboard/admin/reviews/hooks/use-review-mutations";

export type ReviewApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export function ReviewApproveDialog({
  open,
  onOpenChange,
  review,
}: ReviewApproveDialogProps) {
  const mutation = useReviewApproveMutation({
    review,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve review</DialogTitle>
          <DialogDescription>
            {review
              ? `Approve the ${review.rating}-star review by ${reviewCustomerLabel(review)} on ${review.product?.name ?? "this product"}?`
              : "Approve this review?"}
          </DialogDescription>
        </DialogHeader>
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
            disabled={!review || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

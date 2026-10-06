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
import { useReviewDeleteMutation } from "@/features/dashboard/admin/reviews/hooks/use-review-mutations";

export type ReviewDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export function ReviewDeleteDialog({
  open,
  onOpenChange,
  review,
}: ReviewDeleteDialogProps) {
  const mutation = useReviewDeleteMutation({
    review,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete review</DialogTitle>
          <DialogDescription>
            {review
              ? `Delete the ${review.rating}-star review by ${reviewCustomerLabel(review)}? This cannot be undone.`
              : "Delete this review?"}
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
            variant="destructive"
            disabled={!review || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import type { AdminReviewItem } from "./models";

export type {
  Envelope,
  ReviewStatusFilter,
  AdminReviewItem,
  ReviewPagination,
  ReviewListResult,
  ReviewListParams,
} from "./models";

export type ReviewViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export type ReviewApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export type ReviewRejectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

export type ReviewDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReviewItem | null;
};

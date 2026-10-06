"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewApproveDialog } from "@/features/dashboard/admin/reviews/components/review-approve-dialog";
import { ReviewDeleteDialog } from "@/features/dashboard/admin/reviews/components/review-delete-dialog";
import { ReviewRejectDialog } from "@/features/dashboard/admin/reviews/components/review-reject-dialog";
import { ReviewViewDialog } from "@/features/dashboard/admin/reviews/components/review-view-dialog";
import {
  commentSnippet,
  isReviewRejected,
  reviewCustomerLabel,
  reviewStatusLabel,
  toReviewErrorMessage,
  type AdminReviewItem,
  type ReviewListResult,
  type ReviewStatusFilter,
} from "@/features/dashboard/admin/reviews/api/reviews";
import { useReviewList } from "@/features/dashboard/admin/reviews/hooks/use-review-list";

type Props = {
  initialData: ReviewListResult;
};

export function ReviewTable({ initialData }: Props) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [status, setStatus] = useState<ReviewStatusFilter | "">("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState<AdminReviewItem | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState<AdminReviewItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminReviewItem | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminReviewItem | null>(null);

  const { query, items, pagination } = useReviewList({
    initialData,
    page,
    status,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={status || "__all__"}
          onValueChange={(v) => {
            setStatus(v === "__all__" ? "" : (v as ReviewStatusFilter));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full sm:w-52"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All reviews" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {pagination.total} reviews
        </p>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toReviewErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No reviews found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.product?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <p>{reviewCustomerLabel(review)}</p>
                      {review.customerProfile?.user?.email ? (
                        <p className="text-xs text-muted-foreground">
                          {review.customerProfile.user.email}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {review.rating}/5
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {commentSnippet(review.comment)}
                    </TableCell>
                    <TableCell>
                      {review.verifiedPurchase ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${
                          review.isApproved
                            ? "bg-primary text-primary-foreground"
                            : isReviewRejected(review)
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {reviewStatusLabel(review)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewing(review);
                            setViewOpen(true);
                          }}
                        >
                          View
                        </Button>
                        {!review.isApproved ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setApproving(review);
                              setApproveOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                        ) : null}
                        {!isReviewRejected(review) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejecting(review);
                              setRejectOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleting(review);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ReviewApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        review={approving}
      />
      <ReviewRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        review={rejecting}
      />
      <ReviewDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        review={deleting}
      />
      <ReviewViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        review={viewing}
      />
    </div>
  );
}

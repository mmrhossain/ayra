"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approveReview,
  deleteReview,
  rejectReview,
  type AdminReviewItem,
} from "@/features/dashboard/admin/reviews/api/reviews";
import { toReviewErrorMessage } from "@/features/dashboard/admin/reviews/utils";

export function useReviewApproveMutation({
  review,
  onSuccess,
}: {
  review: AdminReviewItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!review) throw new Error("Missing review");
      await approveReview(review.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review approved");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toReviewErrorMessage(err));
    },
  });
}

export function useReviewRejectMutation({
  review,
  onSuccess,
}: {
  review: AdminReviewItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      if (!review) throw new Error("Missing review");
      await rejectReview(review.id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review rejected");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toReviewErrorMessage(err));
    },
  });
}

export function useReviewDeleteMutation({
  review,
  onSuccess,
}: {
  review: AdminReviewItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!review) throw new Error("Missing review");
      await deleteReview(review.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toReviewErrorMessage(err));
    },
  });
}

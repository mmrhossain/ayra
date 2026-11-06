"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  reviewReturnRequest,
  toOrderErrorMessage,
  type AdminReturnRequest,
} from "@/features/dashboard/admin/orders/api/orders";

export function useReturnReviewMutation({
  request,
  status,
  onSuccess,
}: {
  request: AdminReturnRequest | null;
  status: "APPROVED" | "REJECTED";
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      adminNote: string;
      items?: Array<{
        orderItemId: string;
        restockToStock?: boolean;
        damaged?: boolean;
      }>;
    }) => {
      if (!request) throw new Error("Missing return request");
      return reviewReturnRequest(request.id, {
        status,
        adminNote: input.adminNote.trim() || undefined,
        ...(input.items ? { items: input.items } : {}),
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Return ${updated.status.toLowerCase()}`);
      onSuccess();
    },
    onError: (err) => {
      toast.error(toOrderErrorMessage(err));
    },
  });
}

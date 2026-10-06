"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelMyOrder,
  createReturnRequest,
} from "@/features/dashboard/customer/orders/api/orders";
import type { CreateReturnRequestBody } from "@/features/dashboard/customer/orders/types";
import { toCustomerApiError } from "@/features/dashboard/customer/orders/utils";

export function useCancelOrderMutation({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelMyOrder(orderId),
    onSuccess: (order) => {
      queryClient.setQueryData(["customer-order", orderId], order);
      queryClient.invalidateQueries({ queryKey: ["customer-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      toast.success("Order cancelled");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toCustomerApiError(err));
    },
  });
}

export function useReturnRequestMutation({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateReturnRequestBody) =>
      createReturnRequest(orderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      toast.success("Return request submitted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toCustomerApiError(err));
    },
  });
}

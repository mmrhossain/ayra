"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  collectCodPayment,
  fetchPaymentById,
  refundPayment,
} from "@/features/dashboard/admin/payments/api/payments";
import type { RefundFormValues } from "@/features/dashboard/admin/payments/schemas";
import type { PaymentRecord } from "@/features/dashboard/admin/payments/types";
import { toPaymentErrorMessage } from "@/features/dashboard/admin/payments/utils";

export function usePaymentDetailQuery({
  open,
  payment,
}: {
  open: boolean;
  payment: PaymentRecord | null;
}) {
  return useQuery({
    queryKey: ["payments", "detail", payment?.id],
    queryFn: () => fetchPaymentById(payment!.id),
    enabled: open && Boolean(payment?.id),
    staleTime: 15_000,
  });
}

export function useCollectCodMutation({
  payment,
  onSuccess,
}: {
  payment: PaymentRecord | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!payment) throw new Error("Missing payment");
      return collectCodPayment(payment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("COD payment collected");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toPaymentErrorMessage(err));
    },
  });
}

export function useRefundMutation({
  payment,
  onSuccess,
}: {
  payment: PaymentRecord | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: RefundFormValues) => {
      if (!payment) throw new Error("Missing payment");
      return refundPayment(payment.id, {
        amount: values.amount,
        reason: values.reason?.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Refund created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toPaymentErrorMessage(err));
    },
  });
}

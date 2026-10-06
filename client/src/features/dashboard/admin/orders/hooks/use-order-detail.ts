"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  fetchOrderById,
  fetchReturnRequests,
  reviewReturnRequest,
  updateOrderStatus,
} from "@/features/dashboard/admin/orders/api/orders";
import type {
  OrderListItem,
  OrderPaymentSummary,
  OrderStatus,
} from "@/features/dashboard/admin/orders/types";
import { ALLOWED_TRANSITIONS, toOrderErrorMessage } from "@/features/dashboard/admin/orders/utils";
import type { PaymentRecord } from "@/features/dashboard/admin/payments/types";

export function useOrderDetail(open: boolean, order: OrderListItem | null) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<OrderStatus | "">("");
  const [remarks, setRemarks] = useState("");
  const [collectOpen, setCollectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentRecord | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const orderId = order?.id;

  const detailQuery = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => fetchOrderById(orderId!),
    enabled: open && Boolean(orderId),
    staleTime: 30_000,
  });

  const detail = detailQuery.data ?? (order ? { ...order } : null);

  const nextStatuses = detail?.status
    ? (ALLOWED_TRANSITIONS[detail.status as OrderStatus] ?? [])
    : [];

  const returnsQuery = useQuery({
    queryKey: ["return-requests", orderId],
    queryFn: () => fetchReturnRequests({ orderId: orderId!, limit: 50 }),
    enabled: open && Boolean(orderId),
    staleTime: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: { id: string; status: "APPROVED" | "REJECTED" }) => {
      return reviewReturnRequest(input.id, {
        status: input.status,
        adminNote: adminNote.trim() || undefined,
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setAdminNote("");
      toast.success(`Return ${updated.status.toLowerCase()}`);
    },
    onError: (err) => {
      toast.error(toOrderErrorMessage(err));
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Missing order");
      if (!status) throw new Error("Select a status");
      return updateOrderStatus(order.id, {
        status,
        remarks: remarks.trim() || undefined,
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Status updated to ${updated.status}`);
      setStatus("");
      setRemarks("");
    },
    onError: (err) => {
      toast.error(toOrderErrorMessage(err));
    },
  });

  const handleCollect = (payment: OrderPaymentSummary) => {
    setActivePayment(payment as PaymentRecord);
    setCollectOpen(true);
  };

  const handleRefund = (payment: OrderPaymentSummary) => {
    setActivePayment(payment as PaymentRecord);
    setRefundOpen(true);
  };

  return {
    detailQuery,
    detail,
    nextStatuses,
    returnsQuery,
    reviewMutation,
    mutation,
    status,
    setStatus,
    remarks,
    setRemarks,
    collectOpen,
    setCollectOpen,
    refundOpen,
    setRefundOpen,
    activePayment,
    adminNote,
    setAdminNote,
    handleCollect,
    handleRefund,
  };
}

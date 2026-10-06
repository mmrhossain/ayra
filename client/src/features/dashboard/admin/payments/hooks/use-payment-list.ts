"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchPaymentList } from "@/features/dashboard/admin/payments/api/payments";
import type {
  PaymentListResult,
  PaymentMethodFilter,
  PaymentStatus,
} from "@/features/dashboard/admin/payments/types";

const PAGE_SIZE = 20;

export function usePaymentList({
  initialData,
  page,
  status,
  method,
  from,
  to,
}: {
  initialData: PaymentListResult;
  page: number;
  status: PaymentStatus | "";
  method: PaymentMethodFilter | "";
  from?: string;
  to?: string;
}) {
  const query = useQuery({
    queryKey: ["payments", page, status, method, from ?? "", to ?? ""],
    queryFn: () =>
      fetchPaymentList({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        method: method || undefined,
        from,
        to,
      }),
    initialData:
      page === initialData.pagination.page &&
      status === "" &&
      method === "" &&
      !from &&
      !to
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

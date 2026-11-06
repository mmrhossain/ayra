"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchRefundList } from "@/features/dashboard/admin/payments/api/payments";
import type {
  PaymentMethodFilter,
  RefundListResult,
  RefundStatus,
} from "@/features/dashboard/admin/payments/types";

const PAGE_SIZE = 20;

export function useRefundList({
  initialData,
  page,
  status,
  method,
  search,
  manual,
}: {
  initialData: RefundListResult;
  page: number;
  status: RefundStatus | "";
  method: PaymentMethodFilter | "";
  search: string;
  manual: "" | "true" | "false";
}) {
  const requiresManualProcessing =
    manual === "" ? undefined : manual === "true";

  const query = useQuery({
    queryKey: ["refunds", page, status, method, search, manual],
    queryFn: () =>
      fetchRefundList({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        method: method || undefined,
        search: search || undefined,
        requiresManualProcessing,
      }),
    initialData:
      page === initialData.pagination.page &&
      status === "" &&
      method === "" &&
      search === "" &&
      manual === ""
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

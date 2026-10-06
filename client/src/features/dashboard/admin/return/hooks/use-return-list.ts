"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchReturnRequests } from "@/features/dashboard/admin/orders/api/orders";
import type {
  ReturnRequestListResult,
  ReturnRequestStatus,
} from "@/features/dashboard/admin/orders/types";

const PAGE_SIZE = 20;

export function useReturnList({
  initialData,
  page,
  status,
}: {
  initialData: ReturnRequestListResult;
  page: number;
  status: ReturnRequestStatus | "";
}) {
  const query = useQuery({
    queryKey: ["return-requests", page, status],
    queryFn: () =>
      fetchReturnRequests({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
      }),
    initialData:
      page === initialData.pagination.page && status === ""
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchOrderList } from "@/features/dashboard/admin/orders/api/orders";
import type {
  OrderListResult,
  OrderStatus,
} from "@/features/dashboard/admin/orders/types";

const PAGE_SIZE = 20;

export function useOrderList({
  initialData,
  page,
  status,
  from,
  to,
}: {
  initialData: OrderListResult;
  page: number;
  status: OrderStatus | "";
  from?: string;
  to?: string;
}) {
  const query = useQuery({
    queryKey: ["orders", page, status, from ?? "", to ?? ""],
    queryFn: () =>
      fetchOrderList({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        from,
        to,
      }),
    initialData:
      page === initialData.pagination.page && status === "" && !from && !to
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

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
  initialSearch = "",
  page,
  status,
  from,
  to,
  search,
}: {
  initialData: OrderListResult;
  initialSearch?: string;
  page: number;
  status: OrderStatus | "";
  from?: string;
  to?: string;
  search?: string;
}) {
  const query = useQuery({
    queryKey: ["orders", page, status, from ?? "", to ?? "", search ?? ""],
    queryFn: () =>
      fetchOrderList({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        from,
        to,
        search: search || undefined,
      }),
    initialData:
      page === initialData.pagination.page &&
      status === "" &&
      !from &&
      !to &&
      (search ?? "") === initialSearch
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

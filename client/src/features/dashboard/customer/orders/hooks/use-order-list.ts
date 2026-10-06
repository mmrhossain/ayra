"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchMyOrders } from "@/features/dashboard/customer/orders/api/orders";
import type { CustomerOrderListResult } from "@/features/dashboard/customer/orders/types";

const PAGE_SIZE = 20;

export function useOrderList({
  initialData,
  page,
}: {
  initialData: CustomerOrderListResult;
  page: number;
}) {
  const query = useQuery({
    queryKey: ["customer-orders", page],
    queryFn: () => fetchMyOrders({ page, limit: PAGE_SIZE }),
    initialData:
      page === initialData.pagination.page ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

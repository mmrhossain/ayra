"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchWarehouseList } from "@/features/dashboard/admin/warehouses/api/warehouses";
import type { WarehouseListResult } from "@/features/dashboard/admin/warehouses/types";

const PAGE_SIZE = 20;

export function useWarehouseList({
  initialData,
  page,
  search,
}: {
  initialData: WarehouseListResult;
  page: number;
  search: string;
}) {
  const query = useQuery({
    queryKey: ["admin-warehouses", page, search],
    queryFn: () =>
      fetchWarehouseList({
        page,
        limit: PAGE_SIZE,
        search,
      }),
    initialData:
      page === initialData.pagination.page && search === ""
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

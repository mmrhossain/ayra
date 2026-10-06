"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchInventoryList } from "@/features/dashboard/admin/inventory/api/inventory";
import type { InventoryListResult } from "@/features/dashboard/admin/inventory/types";
import { LOW_STOCK_THRESHOLD } from "@/features/dashboard/admin/inventory/types";
import { fetchWarehouseList } from "@/features/dashboard/admin/warehouses/api/warehouses";

const PAGE_SIZE = 20;

export function useInventoryList({
  initialData,
  page,
  warehouseId,
  lowStockOnly,
  search,
  variantId,
  initialSearch,
  initialVariantId,
}: {
  initialData: InventoryListResult;
  page: number;
  warehouseId: string;
  lowStockOnly: boolean;
  search: string;
  variantId: string;
  initialSearch?: string;
  initialVariantId?: string;
}) {
  const query = useQuery({
    queryKey: [
      "admin-inventory",
      page,
      warehouseId,
      lowStockOnly,
      search,
      variantId,
    ],
    queryFn: () =>
      fetchInventoryList({
        page,
        limit: PAGE_SIZE,
        warehouseId: warehouseId || undefined,
        variantId: variantId || undefined,
        search: search || undefined,
        lowStockOnly: lowStockOnly || undefined,
      }),
    initialData:
      page === initialData.pagination.page &&
      warehouseId === "" &&
      !lowStockOnly &&
      search === (initialSearch ?? "") &&
      variantId === (initialVariantId ?? "")
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const warehousesQuery = useQuery({
    queryKey: ["admin-warehouses", "options"],
    queryFn: () => fetchWarehouseList({ page: 1, limit: 100 }),
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return {
    query,
    warehousesQuery,
    data,
    items: data.items,
    pagination: data.pagination,
    warehouses: warehousesQuery.data?.items ?? [],
    lowStockThreshold: data.lowStockThreshold ?? LOW_STOCK_THRESHOLD,
  };
}

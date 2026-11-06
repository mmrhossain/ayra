"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchAdminBrandList } from "@/features/dashboard/admin/brands/api/brands";
import type { BrandListResult } from "@/features/dashboard/admin/brands/types";

const PAGE_SIZE = 20;

export function useBrandList({
  initialData,
  page,
  search,
}: {
  initialData: BrandListResult;
  page: number;
  search: string;
}) {
  const query = useQuery({
    queryKey: ["admin-brands", page, search],
    queryFn: () =>
      fetchAdminBrandList({
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
  return {
    query,
    data,
    items: data.items,
    pagination: data.pagination,
  };
}

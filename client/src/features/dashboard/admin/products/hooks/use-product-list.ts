"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCategoryList } from "@/features/dashboard/admin/categories/api/categories";
import { fetchProductList } from "@/features/dashboard/admin/products/api/products";
import type { ProductListResult } from "@/features/dashboard/admin/products/types";

const PAGE_SIZE = 20;

export function useProductList({
  initialData,
  page,
  search,
}: {
  initialData: ProductListResult;
  page: number;
  search: string;
}) {
  const query = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () =>
      fetchProductList({
        page,
        limit: PAGE_SIZE,
        search,
        includeInactive: true,
      }),
    initialData:
      page === initialData.pagination.page && search === ""
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories", "options"],
    queryFn: () => fetchCategoryList(),
    staleTime: 60_000,
  });

  const data = query.data ?? initialData;
  return {
    query,
    categoriesQuery,
    data,
    items: data.items,
    pagination: data.pagination,
    hasCategories: (categoriesQuery.data ?? []).length > 0,
  };
}

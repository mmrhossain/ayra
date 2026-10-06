"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchAdminCategoryList,
  fetchCategoryList,
  flattenCategories,
} from "@/features/dashboard/admin/categories/api/categories";
import type { CategoryListResult } from "@/features/dashboard/admin/categories/types";

const PAGE_SIZE = 20;

export function useCategoryList({
  initialData,
  page,
  search,
}: {
  initialData: CategoryListResult;
  page: number;
  search: string;
}) {
  const query = useQuery({
    queryKey: ["admin-categories", page, search],
    queryFn: () =>
      fetchAdminCategoryList({
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

  const optionsQuery = useQuery({
    queryKey: ["admin-categories", "options"],
    queryFn: () => fetchCategoryList(),
    staleTime: 60_000,
  });

  const data = query.data ?? initialData;
  return {
    query,
    optionsQuery,
    data,
    items: data.items,
    pagination: data.pagination,
    parentOptions: flattenCategories(optionsQuery.data ?? []),
  };
}

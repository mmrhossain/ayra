"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCouponList } from "@/features/dashboard/admin/coupons/api/coupons";
import type { CouponListResult } from "@/features/dashboard/admin/coupons/types";

const PAGE_SIZE = 20;

export function useCouponList({
  initialData,
  page,
  search,
}: {
  initialData: CouponListResult;
  page: number;
  search: string;
}) {
  const query = useQuery({
    queryKey: ["coupons", page, search],
    queryFn: () => fetchCouponList({ page, limit: PAGE_SIZE, search }),
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

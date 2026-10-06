"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchAdminUserList } from "@/features/dashboard/admin/customers/api/customer";
import type { UserListResult } from "@/features/dashboard/admin/customers/types";

const PAGE_SIZE = 20;

export function useVendorList({
  initialData,
  page,
}: {
  initialData: UserListResult;
  page: number;
}) {
  const query = useQuery({
    queryKey: ["admin-vendors", page],
    queryFn: () =>
      fetchAdminUserList({
        page,
        limit: PAGE_SIZE,
        role: "VENDOR",
      }),
    initialData: page === 1 ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

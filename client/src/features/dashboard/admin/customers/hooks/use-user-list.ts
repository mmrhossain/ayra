"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchAdminUserList } from "@/features/dashboard/admin/customers/api/customer";
import type {
  UserListResult,
  UserRole,
  UserStatus,
} from "@/features/dashboard/admin/customers/types";

const PAGE_SIZE = 20;

export function useUserList({
  initialData,
  page,
  role,
  status,
  initialRole,
  initialStatus,
}: {
  initialData: UserListResult;
  page: number;
  role: UserRole | "";
  status: UserStatus | "";
  initialRole?: UserRole;
  initialStatus?: UserStatus;
}) {
  const query = useQuery({
    queryKey: ["users", page, role, status],
    queryFn: () =>
      fetchAdminUserList({
        page,
        limit: PAGE_SIZE,
        role: role || undefined,
        status: status || undefined,
      }),
    initialData:
      page === 1 &&
      role === (initialRole ?? "") &&
      status === (initialStatus ?? "")
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

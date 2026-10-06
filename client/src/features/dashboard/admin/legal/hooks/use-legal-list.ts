"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchLegalList } from "@/features/dashboard/admin/legal/api/legal";
import type {
  LegalListResult,
  LegalType,
} from "@/features/dashboard/admin/legal/types";

const PAGE_SIZE = 20;

export function useLegalList({
  initialData,
  page,
  type,
}: {
  initialData: LegalListResult;
  page: number;
  type: LegalType | "";
}) {
  const query = useQuery({
    queryKey: ["admin-legal", page, type],
    queryFn: () =>
      fetchLegalList({
        page,
        limit: PAGE_SIZE,
        type: type || undefined,
      }),
    initialData:
      page === initialData?.meta?.page && type === "" ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.meta };
}

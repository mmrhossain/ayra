"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchAdminReviewList } from "@/features/dashboard/admin/reviews/api/reviews";
import type {
  ReviewListResult,
  ReviewStatusFilter,
} from "@/features/dashboard/admin/reviews/types";

const PAGE_SIZE = 20;

export function useReviewList({
  initialData,
  page,
  status,
}: {
  initialData: ReviewListResult;
  page: number;
  status: ReviewStatusFilter | "";
}) {
  const query = useQuery({
    queryKey: ["reviews", page, status],
    queryFn: () =>
      fetchAdminReviewList({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
      }),
    initialData:
      page === initialData.pagination.page && status === ""
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchSliderList } from "@/features/dashboard/admin/sliders/api/slider";
import type { SliderListResult } from "@/features/dashboard/admin/sliders/types";

const PAGE_SIZE = 20;

export function useSliderList({
  initialData,
  page,
  title,
  status,
}: {
  initialData: SliderListResult;
  page: number;
  title: string;
  status: "all" | "true" | "false";
}) {
  const isActive = status === "all" ? undefined : status === "true";

  const query = useQuery({
    queryKey: ["admin-sliders", page, title, status],
    queryFn: () =>
      fetchSliderList({
        page,
        limit: PAGE_SIZE,
        title,
        isActive,
      }),
    initialData:
      page === initialData.pagination.page && title === "" && status === "all"
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

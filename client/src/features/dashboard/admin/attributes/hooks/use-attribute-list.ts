"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAttributeList } from "@/features/dashboard/admin/attributes/api/attributes";
import type { AttributeListItem } from "@/features/dashboard/admin/attributes/types";

export function useAttributeList(initialData: AttributeListItem[]) {
  const query = useQuery({
    queryKey: ["admin-attributes"],
    queryFn: fetchAttributeList,
    initialData,
    staleTime: 30_000,
  });

  return { query, items: query.data ?? initialData };
}

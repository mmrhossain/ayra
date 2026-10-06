"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchFaqCategories,
  fetchFaqItems,
} from "@/features/dashboard/admin/faqs/api/faqs";
import type {
  FaqCategoryListItem,
  FaqItemListItem,
} from "@/features/dashboard/admin/faqs/types";

export function useFaqList({
  initialCategories,
  initialItems,
  categoryFilter,
}: {
  initialCategories: FaqCategoryListItem[];
  initialItems: FaqItemListItem[];
  categoryFilter: string;
}) {
  const categoriesQuery = useQuery({
    queryKey: ["admin-faq-categories"],
    queryFn: fetchFaqCategories,
    initialData: initialCategories,
    staleTime: 30_000,
  });

  const itemsQuery = useQuery({
    queryKey: ["admin-faq-items", categoryFilter],
    queryFn: () => fetchFaqItems(categoryFilter || undefined),
    initialData: categoryFilter === "" ? initialItems : undefined,
    staleTime: 30_000,
  });

  const categories = categoriesQuery.data ?? initialCategories;
  const items = itemsQuery.data ?? (categoryFilter === "" ? initialItems : []);

  return { categoriesQuery, itemsQuery, categories, items };
}

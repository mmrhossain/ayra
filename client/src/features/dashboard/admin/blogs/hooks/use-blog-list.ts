"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchBlogCategories,
  fetchBlogList,
} from "@/features/dashboard/admin/blogs/api/blogs";
import type {
  BlogCategoryListItem,
  BlogListResult,
  BlogStatus,
} from "@/features/dashboard/admin/blogs/types";

const PAGE_SIZE = 20;

export function useBlogList({
  initialPosts,
  initialCategories,
  page,
  search,
  status,
  categoryId,
}: {
  initialPosts: BlogListResult;
  initialCategories: BlogCategoryListItem[];
  page: number;
  search: string;
  status: BlogStatus | "";
  categoryId: string;
}) {
  const query = useQuery({
    queryKey: ["admin-blogs", page, search, status, categoryId],
    queryFn: () =>
      fetchBlogList({
        page,
        limit: PAGE_SIZE,
        search,
        status: status || undefined,
        categoryId: categoryId || undefined,
      }),
    initialData:
      page === initialPosts.pagination.page &&
      search === "" &&
      status === "" &&
      categoryId === ""
        ? initialPosts
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: fetchBlogCategories,
    initialData: initialCategories,
    staleTime: 30_000,
  });

  const data = query.data ?? initialPosts;
  return {
    query,
    categoriesQuery,
    data,
    items: data.items,
    pagination: data.pagination,
    categories: categoriesQuery.data ?? initialCategories,
  };
}

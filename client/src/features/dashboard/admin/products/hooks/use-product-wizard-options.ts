"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchAttributeList } from "@/features/dashboard/admin/attributes/api/attributes";
import { fetchWarehouseList } from "@/features/dashboard/admin/warehouses/api/warehouses";
import {
  fetchCategoryList,
  flattenCategories,
} from "@/features/dashboard/admin/categories/api/categories";
import { fetchBrands } from "@/features/catalog/api";

export function useProductWizardOptions() {
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories", "options"],
    queryFn: () => fetchCategoryList(),
    staleTime: 60_000,
  });
  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });
  const attributesQuery = useQuery({
    queryKey: ["admin-attributes"],
    queryFn: fetchAttributeList,
    staleTime: 60_000,
  });
  const warehousesQuery = useQuery({
    queryKey: ["admin-warehouses", "options", "active"],
    queryFn: () => fetchWarehouseList({ page: 1, limit: 100, isActive: true }),
    staleTime: 60_000,
  });

  const categories = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  return {
    categoriesQuery,
    brandsQuery,
    attributesQuery,
    warehousesQuery,
    categories,
  };
}

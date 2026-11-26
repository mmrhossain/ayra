"use client";

import {
  useQuery } from "@tanstack/react-query";


import { fetchAttributeList } from "@/features/dashboard/admin/attributes/api/attributes";
import { fetchWarehouseList } from "@/features/dashboard/admin/warehouses/api/warehouses";
import {
  fetchCategoryList,
  flattenCategories,
} from "@/features/dashboard/admin/categories/api/categories";
import { fetchBrands } from "@/features/catalog/api";
import { authClient } from "@/lib/api/auth/auth-client";
import { hasAdminPermission } from "@/lib/admin-permissions";

export function useProductWizardOptions() {
  const { data: session } = authClient.useSession();
  const canManageInventory = hasAdminPermission(session?.user ?? {}, "inventory");

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
    queryKey: ["admin-warehouses", "options", "active", canManageInventory],
    queryFn: () => fetchWarehouseList({ page: 1, limit: 100, isActive: true }),
    staleTime: 60_000,
    enabled: canManageInventory,
  });

  const categories = flattenCategories(categoriesQuery.data ?? []);

  return {
    categoriesQuery,
    brandsQuery,
    attributesQuery,
    warehousesQuery,
    categories,
    canManageInventory,
  };
}

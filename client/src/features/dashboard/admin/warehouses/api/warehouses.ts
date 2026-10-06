import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateWarehouseBody,
  Envelope,
  UpdateWarehouseBody,
  WarehouseListItem,
  WarehouseListParams,
  WarehouseListResult,
} from "@/features/dashboard/admin/warehouses/types";

export type {
  CreateWarehouseBody,
  Envelope,
  UpdateWarehouseBody,
  WarehouseListItem,
  WarehouseListParams,
  WarehouseListResult,
  WarehousePagination,
} from "@/features/dashboard/admin/warehouses/types";

export {
  toWarehouseErrorMessage,
  warehouseLabel,
} from "@/features/dashboard/admin/warehouses/utils";

const noStore = { cache: "no-store" as const };

export async function fetchWarehouseList(
  params: WarehouseListParams = {},
): Promise<WarehouseListResult> {
  const res = await dashboardApi.get<Envelope<WarehouseListResult>>(
    "/admin/warehouses",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search || undefined,
        isActive: params.isActive,
      },
    },
  );
  return res.data;
}

export async function createWarehouse(
  body: CreateWarehouseBody,
): Promise<WarehouseListItem> {
  const res = await dashboardApi.post<Envelope<WarehouseListItem>>(
    "/admin/warehouses",
    { body },
  );
  return res.data;
}

export async function updateWarehouse(
  id: string,
  body: UpdateWarehouseBody,
): Promise<WarehouseListItem> {
  const res = await dashboardApi.put<Envelope<WarehouseListItem>>(
    `/admin/warehouses/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/warehouses/${id}`);
}

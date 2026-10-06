import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AdjustmentRecord,
  CreateAdjustmentBody,
  Envelope,
  InventoryListParams,
  InventoryListResult,
} from "@/features/dashboard/admin/inventory/types";

export type {
  AdjustmentRecord,
  CreateAdjustmentBody,
  Envelope,
  InventoryListItem,
  InventoryListParams,
  InventoryListResult,
  InventoryPagination,
} from "@/features/dashboard/admin/inventory/types";

export { LOW_STOCK_THRESHOLD } from "@/features/dashboard/admin/inventory/types";

export { toInventoryErrorMessage } from "@/features/dashboard/admin/inventory/utils";

const noStore = { cache: "no-store" as const };

export async function fetchInventoryList(
  params: InventoryListParams = {},
): Promise<InventoryListResult> {
  const res = await dashboardApi.get<Envelope<InventoryListResult>>(
    "/admin/inventory",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        warehouseId: params.warehouseId || undefined,
        variantId: params.variantId || undefined,
        search: params.search || undefined,
        lowStockOnly: params.lowStockOnly || undefined,
      },
    },
  );
  return res.data;
}

export async function createInventoryAdjustment(
  body: CreateAdjustmentBody,
): Promise<AdjustmentRecord> {
  const res = await dashboardApi.post<Envelope<AdjustmentRecord>>(
    "/admin/inventory/adjustments",
    { body },
  );
  return res.data;
}

export async function approveInventoryAdjustment(
  id: string,
): Promise<AdjustmentRecord> {
  const res = await dashboardApi.post<Envelope<AdjustmentRecord>>(
    `/admin/inventory/adjustments/${id}/approve`,
    { body: { approved: true } },
  );
  return res.data;
}

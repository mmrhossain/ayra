import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AdjustmentRecord,
  CreateAdjustmentBody,
  Envelope,
  InventoryListParams,
  InventoryListResult,
  SetStockLevelsBody,
  SetStockLevelsResult,
} from "@/features/dashboard/admin/inventory/types";

export type {
  AdjustmentRecord,
  CreateAdjustmentBody,
  Envelope,
  InventoryListItem,
  InventoryListParams,
  InventoryListResult,
  InventoryPagination,
  SetStockLevelItem,
  SetStockLevelsBody,
  SetStockLevelsResult,
  StockLevelChange,
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

/**
 * Applies desired stock levels for many variants in a single request. Applied
 * auto-approved with an audit row on the server, so it replaces the
 * create-then-approve pair that used to run once per variant.
 */
export async function setInventoryStock(
  body: SetStockLevelsBody,
): Promise<SetStockLevelsResult> {
  const res = await dashboardApi.put<Envelope<SetStockLevelsResult>>(
    "/admin/inventory/stock",
    { body },
  );
  return res.data;
}

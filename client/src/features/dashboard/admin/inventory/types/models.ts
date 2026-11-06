export type { Envelope } from "@/lib/api/http";

export const LOW_STOCK_THRESHOLD = 10;

export type InventoryListItem = {
  id: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  warehouseId: string;
  variantId: string;
  warehouse: { id: string; name: string; code: string };
  variant: {
    id: string;
    sku: string;
    product: { id: string; name: string; slug: string };
  };
  variantName?: string | null;
  lastUpdatedAt?: string | null;
  lastUpdatedByName?: string | null;
};

export type InventoryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type InventoryListResult = {
  items: InventoryListItem[];
  pagination: InventoryPagination;
  lowStockThreshold: number;
};

export type InventoryListParams = {
  page?: number;
  limit?: number;
  warehouseId?: string;
  variantId?: string;
  search?: string;
  lowStockOnly?: boolean;
};

export type CreateAdjustmentBody = {
  warehouseId: string;
  variantId: string;
  difference: number;
  reason: string;
};

export type AdjustmentRecord = {
  id: string;
  difference: number;
  adjustedQuantity: number;
  status: string;
};

export type SetStockLevelItem = {
  variantId: string;
  targetQty: number;
};

export type SetStockLevelsBody = {
  warehouseId?: string;
  items: SetStockLevelItem[];
};

export type StockLevelChange = {
  variantId: string;
  quantityOnHand: number;
  quantityAvailable: number;
  difference: number;
};

export type SetStockLevelsResult = {
  warehouseId: string;
  items: StockLevelChange[];
};

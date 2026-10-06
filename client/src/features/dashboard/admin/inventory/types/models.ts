export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

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

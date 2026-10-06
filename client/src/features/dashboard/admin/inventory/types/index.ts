import type { InventoryListItem, InventoryListResult } from "./models";

export type {
  AdjustmentRecord,
  CreateAdjustmentBody,
  Envelope,
  InventoryListItem,
  InventoryListParams,
  InventoryListResult,
  InventoryPagination,
} from "./models";

export { LOW_STOCK_THRESHOLD } from "./models";

export type StockAdjustDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryListItem | null;
};

export type InventoryTableProps = {
  initialData: InventoryListResult;
  initialVariantId?: string;
  initialSearch?: string;
};

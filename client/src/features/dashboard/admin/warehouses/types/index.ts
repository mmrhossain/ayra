import type { WarehouseListItem, WarehouseListResult } from "./models";

export type {
  CreateWarehouseBody,
  Envelope,
  UpdateWarehouseBody,
  WarehouseListItem,
  WarehouseListParams,
  WarehouseListResult,
  WarehousePagination,
} from "./models";

export type DialogMode = "create" | "edit";

export type WarehouseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: WarehouseListItem;
};

export type WarehouseDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: WarehouseListItem | null;
};

export type WarehouseTableProps = {
  initialData: WarehouseListResult;
};

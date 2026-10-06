import type { AttributeListItem, AttributeValueItem } from "./models";

export type {
  AttributeListItem,
  AttributeValueItem,
  Envelope,
} from "./models";

export type DialogMode = "create" | "edit";

export type AttributeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: AttributeListItem;
};

export type AttributeValueFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  attribute: AttributeListItem | null;
  initialData?: AttributeValueItem;
};

export type AttributeDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute: AttributeListItem | null;
};

export type AttributeValueDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: AttributeValueItem | null;
};

export type AttributeTableProps = {
  initialData: AttributeListItem[];
};

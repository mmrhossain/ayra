import type { FaqCategoryListItem, FaqItemListItem } from "./models";

export type {
  Envelope,
  FaqCategoryListItem,
  FaqItemListItem,
  CreateFaqCategoryBody,
  CreateFaqItemBody,
} from "./models";

export type DialogMode = "create" | "edit";

export type FaqCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: FaqCategoryListItem;
};

export type FaqItemFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  categories: FaqCategoryListItem[];
  initialData?: FaqItemListItem;
  defaultCategoryId?: string;
};

export type FaqCategoryDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FaqCategoryListItem | null;
};

export type FaqItemDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FaqItemListItem | null;
};

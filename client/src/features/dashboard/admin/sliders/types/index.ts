import type { SliderListItem, SliderListResult } from "./models";

export type {
  CreateSliderBody,
  Envelope,
  SliderListItem,
  SliderListParams,
  SliderListResult,
  SliderPagination,
  UpdateSliderBody,
} from "./models";

export type DialogMode = "create" | "edit";

export type SliderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: SliderListItem;
};

export type SliderDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slider: SliderListItem | null;
};

export type SliderTableProps = {
  initialData: SliderListResult;
};

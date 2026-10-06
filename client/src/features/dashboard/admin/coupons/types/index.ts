import type { CouponListItem, CouponListResult } from "./models";

export type {
  Envelope,
  CouponStatus,
  DiscountType,
  CouponListItem,
  CouponPagination,
  CouponListResult,
  CouponListParams,
  CreateCouponBody,
} from "./models";

export { COUPON_STATUSES, DISCOUNT_TYPES } from "./models";

export type DialogMode = "create" | "edit";

export type CouponFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialData?: CouponListItem;
};

export type CouponDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: CouponListItem | null;
};

export type CouponTableProps = {
  initialData: CouponListResult;
};

export type CouponPickerOption = {
  id: string;
  label: string;
  hint?: string;
};

export type CouponFormFieldsProps = {
  disabled: boolean;
  productOptions: CouponPickerOption[];
  categoryOptions: CouponPickerOption[];
  productsLoading: boolean;
  categoriesLoading: boolean;
  onProductSearchChange: (query: string) => void;
};

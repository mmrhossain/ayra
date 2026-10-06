import type { PaymentListResult, PaymentRecord } from "./models";

export type {
  Envelope,
  PaymentMethod,
  PaymentStatus,
  PaymentMethodFilter,
  PaymentCustomer,
  PaymentOrder,
  PaymentRecord,
  PaymentTransaction,
  PaymentEvent,
  RefundRecord,
  PaymentDetail,
  PaymentPagination,
  PaymentListResult,
  PaymentListParams,
  RefundInput,
} from "./models";

export { PAYMENT_STATUSES, PAYMENT_METHODS } from "./models";

export type RefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentRecord | null;
};

export type CollectCodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentRecord | null;
};

export type PaymentDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentRecord | null;
};

export type PaymentTableProps = {
  initialData: PaymentListResult;
};

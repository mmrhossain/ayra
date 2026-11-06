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
  RefundQueuePayment,
  RefundQueueItem,
  RefundStatus,
  RefundListParams,
  RefundListResult,
  PaymentDetail,
  PaymentPagination,
  PaymentListResult,
  PaymentListParams,
  RefundInput,
} from "./models";

export {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  REFUND_STATUSES,
} from "./models";

export type RefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentRecord | null;
  remainingAmount?: number;
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

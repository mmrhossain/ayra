import type { OrderDetail, OrderItem, OrderListItem, OrderStatus } from "./models";

export type {
  Envelope,
  OrderStatus,
  OrderAddress,
  OrderItem,
  OrderCustomer,
  OrderListItem,
  OrderDetail,
  OrderPagination,
  OrderListResult,
  OrderListParams,
  UpdateOrderStatusBody,
  ReturnRequestStatus,
  AdminReturnRequest,
  ReturnRequestListResult,
  ReturnRequestListParams,
} from "./models";

export { ORDER_STATUSES } from "./models";

export type OrderDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderListItem | null;
};

export type OrderDetailHeaderProps = {
  customerLabel: string;
  customerEmail?: string | null;
  status: string;
  paymentStatus?: string | null;
  shippingText: string | null;
  billingText: string | null;
};

export type OrderDetailLinesProps = {
  items: OrderItem[];
};

export type OrderPaymentSummary = NonNullable<OrderDetail["payments"]>[number];

export type OrderStatusActionsProps = {
  payments: OrderPaymentSummary[];
  onCollect: (payment: OrderPaymentSummary) => void;
  onRefund: (payment: OrderPaymentSummary) => void;
  nextStatuses: OrderStatus[];
  status: OrderStatus | "";
  onStatusChange: (status: OrderStatus) => void;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
};

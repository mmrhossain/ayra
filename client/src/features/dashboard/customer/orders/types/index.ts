import type { CustomerOrder, CustomerOrderItem, CustomerOrderListResult } from "./models";

export type {
  Envelope,
  CheckoutAddress,
  OrderAddressRecord,
  CustomerOrderItem,
  CustomerReturnRequest,
  CustomerOrderStatusHistory,
  CustomerOrder,
  OrderPagination,
  CustomerOrderListResult,
  ReturnRequestItemInput,
  CreateReturnRequestBody,
} from "./models";

export type OrderTableProps = {
  initialData: CustomerOrderListResult;
};

export type OrderDetailProps = {
  initialData: CustomerOrder;
};

export type CancelOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
};

export type ReturnRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  items: CustomerOrderItem[];
};

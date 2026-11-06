export type { Envelope } from "@/lib/api/http";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderAddress = {
  id: string;
  type?: "SHIPPING" | "BILLING";
  fullName: string;
  phone: string;
  email?: string | null;
  country: string;
  division?: string;
  district?: string;
  thana?: string | null;
  state?: string | null;
  city?: string;
  area?: string | null;
  postalCode?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
};

export type OrderItem = {
  id: string;
  productName: string;
  sku: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number | string;
  costPrice?: number | string | null;
  discountAmount?: number | string;
  taxAmount?: number | string;
  subtotal: number | string;
};

export type OrderCustomer = {
  id: string;
  customerCode: string;
  user?: { email?: string | null; name?: string | null } | null;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus?: string;
  currency?: string;
  subtotal?: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  shippingAmount?: number | string;
  shippingMethodName?: string | null;
  shippingMethodCode?: string | null;
  shippingZoneId?: string | null;
  shippingZoneName?: string | null;
  shippingZoneCode?: string | null;
  shippingRateId?: string | null;
  shippingRatePrice?: number | string | null;
  grandTotal: number | string;
  createdAt: string;
  itemCount?: number;
  customerProfile?: OrderCustomer | null;
};

export type AdminOrderShipment = {
  id: string;
  shipmentNumber: string;
  courierProvider: string;
  status: string;
  trackingNumber?: string | null;
  shippingCost?: number | string;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: Array<{ quantity: number }>;
  trackingEvents: Array<{
    status: string;
    location?: string | null;
    description?: string | null;
    eventTime: string;
  }>;
};

export type OrderDetail = OrderListItem & {
  items: OrderItem[];
  notes?: string | null;
  addresses?: OrderAddress[];
  billingAddress?: OrderAddress | null;
  shippingAddress?: OrderAddress | null;
  shipments?: AdminOrderShipment[];
  statusHistory?: Array<{
    id: string;
    status: OrderStatus;
    remarks?: string | null;
    createdAt: string;
  }>;
  payments?: Array<{
    id: string;
    method: string;
    status: string;
    amount: number | string;
    createdAt: string;
  }>;
};

export type OrderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OrderListResult = {
  items: OrderListItem[];
  pagination: OrderPagination;
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  from?: string;
  to?: string;
  search?: string;
};

export type UpdateOrderStatusBody = {
  status: OrderStatus;
  remarks?: string;
};

export type ReturnRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminReturnRequest = {
  id: string;
  status: ReturnRequestStatus;
  reason?: string | null;
  adminNote?: string | null;
  orderId: string;
  requestedAt?: string;
  createdAt?: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    customerProfileId?: string;
    customerProfile?: OrderCustomer | null;
  };
  items: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    restockOrRefund: "RESTOCK" | "REFUND";
    orderItem?: {
      id: string;
      productName: string;
      sku: string;
      variantName?: string | null;
      unitPrice?: number | string;
      subtotal?: number | string;
    } | null;
  }>;
};

export type ReturnRequestListResult = {
  items: AdminReturnRequest[];
  pagination: OrderPagination;
};

export type ReturnRequestListParams = {
  page?: number;
  limit?: number;
  status?: ReturnRequestStatus;
  orderId?: string;
};

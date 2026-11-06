export type { Envelope } from "@/lib/api/http";

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  division: string;
  district: string;
  thana?: string;
  divisionCode?: string | null;
  districtCode?: string | null;
  upazilaCode?: string | null;
  postalCode?: string;
  addressLine1: string;
  addressLine2?: string;
};

export type OrderAddressRecord = CheckoutAddress & {
  id?: string;
  type?: "SHIPPING" | "BILLING";
};

export type CustomerOrderItem = {
  id: string;
  productName: string;
  sku: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  subtotal: number | string;
};

export type CustomerReturnRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string | null;
  items: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    restockOrRefund: "RESTOCK" | "REFUND";
  }>;
};

export type CustomerRefund = {
  id: string;
  amount: number | string;
  status: string;
  reason?: string | null;
  refundedAt?: string | null;
  createdAt: string;
};

export type CustomerPayment = {
  id: string;
  method: string;
  status: string;
  amount: number | string;
  currency?: string;
  createdAt: string;
  refunds: CustomerRefund[];
};

export type CustomerOrderStatusHistory = {
  id: string;
  status: string;
  remarks?: string | null;
  createdAt: string;
};

export type CustomerOrderEvent = {
  eventType: string;
  createdAt: string;
};

export type CustomerShipmentEvent = {
  status: string;
  location?: string | null;
  description?: string | null;
  eventTime: string;
};

export type CustomerShipment = {
  id: string;
  shipmentNumber: string;
  courierProvider: string;
  status: string;
  trackingNumber?: string | null;
  pickupRequestedAt?: string | null;
  pickedUpAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  items: Array<{ orderItemId: string; quantity: number }>;
  trackingEvents: CustomerShipmentEvent[];
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  currency?: string;
  subtotal?: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  shippingAmount?: number | string;
  shippingMethodName?: string | null;
  shippingMethodCode?: string | null;
  shippingZoneName?: string | null;
  shippingZoneCode?: string | null;
  shippingRatePrice?: number | string | null;
  grandTotal: number | string;
  createdAt: string;
  deliveredAt?: string | null;
  returnDeadline?: string | null;
  canRequestReturn?: boolean;
  items: CustomerOrderItem[];
  addresses?: OrderAddressRecord[];
  billingAddress?: CheckoutAddress | null;
  shippingAddress?: CheckoutAddress | null;
  returnRequests?: CustomerReturnRequest[];
  payments?: CustomerPayment[];
  shipments?: CustomerShipment[];
  statusHistory?: CustomerOrderStatusHistory[];
  events?: CustomerOrderEvent[];
};

export type CustomerOrderListItem = Omit<CustomerOrder, "items"> & {
  itemCount: number;
};

export type OrderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerOrderListResult = {
  items: CustomerOrderListItem[];
  pagination: OrderPagination;
};

export type ReturnRequestItemInput = {
  orderItemId: string;
  quantity: number;
  restockOrRefund: "RESTOCK" | "REFUND";
};

export type CreateReturnRequestBody = {
  reason?: string;
  items: ReturnRequestItemInput[];
};

export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  division: string;
  district: string;
  thana?: string;
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

export type CustomerOrderStatusHistory = {
  id: string;
  status: string;
  remarks?: string | null;
  createdAt: string;
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
  grandTotal: number | string;
  createdAt: string;
  items: CustomerOrderItem[];
  addresses?: OrderAddressRecord[];
  billingAddress?: CheckoutAddress | null;
  shippingAddress?: CheckoutAddress | null;
  returnRequests?: CustomerReturnRequest[];
  statusHistory?: CustomerOrderStatusHistory[];
};

export type OrderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerOrderListResult = {
  items: CustomerOrder[];
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

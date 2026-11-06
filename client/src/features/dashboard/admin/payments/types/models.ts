export type { Envelope } from "@/lib/api/http";

export type PaymentMethod = "COD" | "SSLCOMMERZ" | string;

export const PAYMENT_STATUSES = [
  "PENDING",
  "INITIATED",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "COLLECTED",
] as const;

export const PAYMENT_METHODS = ["COD", "SSLCOMMERZ"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethodFilter = (typeof PAYMENT_METHODS)[number];

export type PaymentCustomer = {
  id: string;
  customerCode: string;
  user?: { id?: string; email?: string | null; name?: string | null } | null;
};

export type PaymentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string | null;
  grandTotal?: number | string;
  currency?: string;
  customerProfile?: PaymentCustomer | null;
};

export type PaymentRecord = {
  id: string;
  method: PaymentMethod;
  status: string;
  amount: number | string;
  currency?: string;
  provider?: string | null;
  providerReference?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
  order?: PaymentOrder | null;
};

export type PaymentTransaction = {
  id: string;
  transactionReference?: string | null;
  gatewayResponse?: unknown;
  status: string;
  amount: number | string;
  createdAt: string;
  updatedAt?: string;
};

export type PaymentEvent = {
  id: string;
  eventType: string;
  metadata?: unknown;
  createdAt: string;
};

export type RefundRecord = {
  id: string;
  amount: number | string;
  reason?: string | null;
  status: string;
  providerReference?: string | null;
  refundedAt?: string | null;
  requiresManualProcessing?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type RefundQueuePayment = {
  id: string;
  method: PaymentMethod;
  status: string;
  amount: number | string;
  currency?: string;
  providerReference?: string | null;
  order?: PaymentOrder | null;
};

export type RefundQueueItem = RefundRecord & {
  payment: RefundQueuePayment;
};

export const REFUND_STATUSES = [
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  "REJECTED",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export type RefundListParams = {
  page?: number;
  limit?: number;
  status?: RefundStatus;
  method?: PaymentMethodFilter;
  search?: string;
  requiresManualProcessing?: boolean;
  from?: string;
  to?: string;
};

export type RefundListResult = {
  items: RefundQueueItem[];
  pagination: PaymentPagination;
};

export type PaymentDetail = PaymentRecord & {
  transactions?: PaymentTransaction[];
  refunds?: RefundRecord[];
  events?: PaymentEvent[];
};

export type PaymentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaymentListResult = {
  items: PaymentRecord[];
  pagination: PaymentPagination;
};

export type PaymentListParams = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethodFilter;
  from?: string;
  to?: string;
};

export type RefundInput = {
  amount: number;
  reason?: string;
};

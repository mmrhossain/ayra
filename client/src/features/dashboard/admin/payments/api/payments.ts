import { dashboardApi } from "@/lib/api/dashboard";
import type {
  Envelope,
  PaymentDetail,
  PaymentListParams,
  PaymentListResult,
  RefundInput,
  RefundListParams,
  RefundListResult,
  RefundRecord,
} from "@/features/dashboard/admin/payments/types";

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
} from "@/features/dashboard/admin/payments/types";

export {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  REFUND_STATUSES,
} from "@/features/dashboard/admin/payments/types";

export {
  toPaymentErrorMessage,
  isCodCollectable,
  isRefundable,
  paymentCustomerLabel,
} from "@/features/dashboard/admin/payments/utils";

const noStore = { cache: "no-store" as const };

export async function fetchPaymentList(
  params: PaymentListParams = {},
): Promise<PaymentListResult> {
  const res = await dashboardApi.get<Envelope<PaymentListResult>>(
    "/admin/payments",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
        method: params.method,
        from: params.from,
        to: params.to,
      },
    },
  );
  return res.data;
}

export async function fetchRefundList(
  params: RefundListParams = {},
): Promise<RefundListResult> {
  const res = await dashboardApi.get<Envelope<RefundListResult>>(
    "/admin/refunds",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
        method: params.method,
        search: params.search,
        requiresManualProcessing:
          params.requiresManualProcessing === undefined
            ? undefined
            : String(params.requiresManualProcessing),
        from: params.from,
        to: params.to,
      },
    },
  );
  return res.data;
}

export async function fetchPaymentById(id: string): Promise<PaymentDetail> {
  const res = await dashboardApi.get<Envelope<PaymentDetail>>(
    `/admin/payments/${id}`,
    noStore,
  );
  return res.data;
}

export async function collectCodPayment(paymentId: string): Promise<unknown> {
  const res = await dashboardApi.post<Envelope<unknown>>(
    `/admin/payments/cod/${paymentId}/collect`,
    noStore,
  );
  return res.data;
}

export type RefundStatusUpdate = {
  status: "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED";
  providerReference?: string;
};

export async function updateRefundStatus(
  refundId: string,
  body: RefundStatusUpdate,
): Promise<RefundRecord> {
  const res = await dashboardApi.patch<Envelope<RefundRecord>>(
    `/admin/refunds/${refundId}`,
    { body },
  );
  return res.data;
}

export async function refundPayment(
  paymentId: string,
  body: RefundInput,
): Promise<RefundRecord> {
  const res = await dashboardApi.post<Envelope<RefundRecord>>(
    `/admin/payments/${paymentId}/refund`,
    { body },
  );
  return res.data;
}

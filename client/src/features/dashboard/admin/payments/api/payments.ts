import { dashboardApi } from "@/lib/api/dashboard";
import type {
  Envelope,
  PaymentDetail,
  PaymentListParams,
  PaymentListResult,
  RefundInput,
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
  PaymentDetail,
  PaymentPagination,
  PaymentListResult,
  PaymentListParams,
  RefundInput,
} from "@/features/dashboard/admin/payments/types";

export {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
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

import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateReturnRequestBody,
  CustomerOrder,
  CustomerOrderListItem,
  CustomerOrderListResult,
  CustomerReturnRequest,
  Envelope,
  OrderPagination,
} from "@/features/dashboard/customer/orders/types";

export type {
  CheckoutAddress,
  CreateReturnRequestBody,
  CustomerOrder,
  CustomerOrderItem,
  CustomerOrderListResult,
  CustomerOrderStatusHistory,
  CustomerReturnRequest,
  Envelope,
  OrderAddressRecord,
  OrderPagination,
  ReturnRequestItemInput,
} from "@/features/dashboard/customer/orders/types";

export {
  formatCheckoutAddress,
  pickOrderAddress,
  toCustomerApiError,
} from "@/features/dashboard/customer/orders/utils";

const noStore = { cache: "no-store" as const };

type CustomerOrderListResponse = {
  items: Array<
    Omit<CustomerOrderListItem, "itemCount"> & { _count?: { items: number } }
  >;
  pagination: OrderPagination;
};

export async function fetchMyOrders(
  params: { page?: number; limit?: number } = {},
): Promise<CustomerOrderListResult> {
  const res = await dashboardApi.get<Envelope<CustomerOrderListResponse>>(
    "/orders",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
  );
  return {
    items: res.data.items.map(({ _count, ...order }) => ({
      ...order,
      itemCount: _count?.items ?? 0,
    })),
    pagination: res.data.pagination,
  };
}

export async function fetchMyOrder(id: string): Promise<CustomerOrder> {
  const res = await dashboardApi.get<Envelope<CustomerOrder>>(
    `/orders/${id}`,
    noStore,
  );
  return res.data;
}

export async function cancelMyOrder(
  id: string,
  reason?: string,
): Promise<CustomerOrder> {
  const res = await dashboardApi.post<Envelope<CustomerOrder>>(
    `/orders/${id}/cancel`,
    { body: reason ? { reason } : {} },
  );
  return res.data;
}

export async function createReturnRequest(
  orderId: string,
  body: CreateReturnRequestBody,
): Promise<CustomerReturnRequest> {
  const res = await dashboardApi.post<Envelope<CustomerReturnRequest>>(
    `/orders/${orderId}/return-request`,
    { body },
  );
  return res.data;
}

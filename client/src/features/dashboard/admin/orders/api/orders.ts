import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AdminReturnRequest,
  Envelope,
  OrderDetail,
  OrderListParams,
  OrderListResult,
  ReturnRequestListParams,
  ReturnRequestListResult,
  UpdateOrderStatusBody,
} from "@/features/dashboard/admin/orders/types";

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
} from "@/features/dashboard/admin/orders/types";

export { ORDER_STATUSES } from "@/features/dashboard/admin/orders/types";

export {
  toOrderErrorMessage,
  money,
  customerLabel,
  itemCount,
  pickOrderAddress,
  returnCustomerLabel,
} from "@/features/dashboard/admin/orders/utils";

const noStore = { cache: "no-store" as const };

export async function fetchOrderList(
  params: OrderListParams = {},
): Promise<OrderListResult> {
  const res = await dashboardApi.get<Envelope<OrderListResult>>(
    "/admin/orders",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
        from: params.from,
        to: params.to,
      },
    },
  );
  return res.data;
}

export async function fetchOrderById(id: string): Promise<OrderDetail> {
  const res = await dashboardApi.get<Envelope<OrderDetail>>(
    `/admin/orders/${id}`,
    noStore,
  );
  return res.data;
}

export async function updateOrderStatus(
  id: string,
  body: UpdateOrderStatusBody,
): Promise<OrderDetail> {
  const res = await dashboardApi.patch<Envelope<OrderDetail>>(
    `/admin/orders/${id}/status`,
    { body },
  );
  return res.data;
}

export async function fetchReturnRequests(
  params: ReturnRequestListParams | string = {},
): Promise<ReturnRequestListResult> {
  const query = typeof params === "string" ? { orderId: params } : params;
  const res = await dashboardApi.get<Envelope<ReturnRequestListResult>>(
    "/admin/return-requests",
    {
      ...noStore,
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        status: query.status,
        orderId: query.orderId,
      },
    },
  );
  return res.data;
}

export async function reviewReturnRequest(
  id: string,
  body: { status: "APPROVED" | "REJECTED"; adminNote?: string },
): Promise<AdminReturnRequest> {
  const res = await dashboardApi.patch<Envelope<AdminReturnRequest>>(
    `/admin/return-requests/${id}`,
    { body },
  );
  return res.data;
}

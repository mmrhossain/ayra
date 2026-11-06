import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateShipmentBody,
  Envelope,
  ShipmentDetail,
  ShipmentListItem,
  ShipmentListParams,
  ShipmentListResult,
  ShipmentOrderContext,
  UpdateShipmentStatusBody,
} from "@/features/dashboard/admin/shipments/types/models";

export type {
  CreateShipmentBody,
  Envelope,
  ShipmentDetail,
  ShipmentListItem,
  ShipmentListParams,
  ShipmentListResult,
  ShipmentOrderContext,
  UpdateShipmentStatusBody,
} from "@/features/dashboard/admin/shipments/types/models";

export { toShipmentErrorMessage } from "@/features/dashboard/admin/shipments/utils";

export async function fetchShipmentList(
  params: ShipmentListParams = {},
): Promise<ShipmentListResult> {
  const res = await dashboardApi.get<Envelope<ShipmentListResult>>(
    "/admin/shipments",
    {
      cache: "no-store",
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status || undefined,
        courierProvider: params.courierProvider || undefined,
        search: params.search || undefined,
      },
    },
  );
  return res.data;
}

export async function fetchShipmentOrderContext(
  reference: string,
): Promise<ShipmentOrderContext> {
  const res = await dashboardApi.get<Envelope<ShipmentOrderContext>>(
    `/admin/shipments/order-context/${encodeURIComponent(reference)}`,
    { cache: "no-store" },
  );
  return res.data;
}

export async function fetchShipmentById(id: string): Promise<ShipmentDetail> {
  const res = await dashboardApi.get<Envelope<ShipmentDetail>>(
    `/admin/shipments/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  return res.data;
}

export async function createShipment(
  body: CreateShipmentBody,
): Promise<ShipmentListItem> {
  const res = await dashboardApi.post<Envelope<ShipmentListItem>>(
    "/admin/shipments",
    { body },
  );
  return res.data;
}

export async function bookShipmentCourier(
  id: string,
): Promise<ShipmentListItem> {
  const res = await dashboardApi.post<Envelope<ShipmentListItem>>(
    `/admin/shipments/${encodeURIComponent(id)}/courier`,
  );
  return res.data;
}

export async function updateShipmentStatus(
  id: string,
  body: UpdateShipmentStatusBody,
): Promise<ShipmentListItem> {
  const res = await dashboardApi.patch<Envelope<ShipmentListItem>>(
    `/admin/shipments/${id}/status`,
    { body },
  );
  return res.data;
}

import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateShippingMethodBody,
  CreateShippingRateBody,
  CreateShippingZoneBody,
  ShippingMethod,
  ShippingOptionsResult,
  ShippingQuote,
  ShippingRate,
  ShippingZone,
} from "@/features/shipping/shipping.types";

export { toShippingErrorMessage } from "@/features/dashboard/admin/shipping/utils";

type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

const noStore = { cache: "no-store" as const };

export async function fetchShippingOptions(params: {
  district: string;
  subtotal?: number;
}): Promise<ShippingOptionsResult> {
  const res = await dashboardApi.get<Envelope<ShippingOptionsResult>>(
    "/shipping/options",
    {
      ...noStore,
      params: {
        district: params.district,
        subtotal: params.subtotal,
      },
    },
  );
  return res.data;
}

export async function quoteShipping(body: {
  shippingMethodCode: string;
  shippingAddress: {
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
  subtotal?: number;
}): Promise<ShippingQuote> {
  const res = await dashboardApi.post<Envelope<ShippingQuote>>(
    "/shipping/quote",
    { body },
  );
  return res.data;
}

export async function fetchShippingZones(): Promise<ShippingZone[]> {
  const res = await dashboardApi.get<Envelope<ShippingZone[]>>(
    "/admin/shipping/zones",
    noStore,
  );
  return res.data ?? [];
}

export async function createShippingZone(
  body: CreateShippingZoneBody,
): Promise<ShippingZone> {
  const res = await dashboardApi.post<Envelope<ShippingZone>>(
    "/admin/shipping/zones",
    { body },
  );
  return res.data;
}

export async function updateShippingZone(
  id: string,
  body: Partial<CreateShippingZoneBody>,
): Promise<ShippingZone> {
  const res = await dashboardApi.put<Envelope<ShippingZone>>(
    `/admin/shipping/zones/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteShippingZone(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/shipping/zones/${id}`);
}

export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
  const res = await dashboardApi.get<Envelope<ShippingMethod[]>>(
    "/admin/shipping/methods",
    noStore,
  );
  return res.data ?? [];
}

export async function createShippingMethod(
  body: CreateShippingMethodBody,
): Promise<ShippingMethod> {
  const res = await dashboardApi.post<Envelope<ShippingMethod>>(
    "/admin/shipping/methods",
    { body },
  );
  return res.data;
}

export async function updateShippingMethod(
  id: string,
  body: Partial<CreateShippingMethodBody>,
): Promise<ShippingMethod> {
  const res = await dashboardApi.put<Envelope<ShippingMethod>>(
    `/admin/shipping/methods/${id}`,
    { body },
  );
  return res.data;
}

export async function fetchShippingRates(): Promise<ShippingRate[]> {
  const res = await dashboardApi.get<Envelope<ShippingRate[]>>(
    "/admin/shipping/rates",
    noStore,
  );
  return res.data ?? [];
}

export async function createShippingRate(
  body: CreateShippingRateBody,
): Promise<ShippingRate> {
  const res = await dashboardApi.post<Envelope<ShippingRate>>(
    "/admin/shipping/rates",
    { body },
  );
  return res.data;
}

export async function updateShippingRate(
  id: string,
  body: Partial<CreateShippingRateBody>,
): Promise<ShippingRate> {
  const res = await dashboardApi.put<Envelope<ShippingRate>>(
    `/admin/shipping/rates/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteShippingRate(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/shipping/rates/${id}`);
}

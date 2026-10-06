import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AddressPayload,
  Envelope,
  SavedAddress,
} from "@/features/dashboard/customer/address/types";

export type { SavedAddress, AddressPayload } from "@/features/dashboard/customer/address/types";

export { toAddressError } from "@/features/dashboard/customer/address/utils";

const noStore = { cache: "no-store" as const };

export async function fetchMyAddresses(): Promise<SavedAddress[]> {
  const res = await dashboardApi.get<Envelope<SavedAddress[]>>(
    "/addresses",
    noStore,
  );
  return res.data ?? [];
}

export async function createAddress(
  body: AddressPayload,
): Promise<SavedAddress> {
  const res = await dashboardApi.post<Envelope<SavedAddress>>("/addresses", {
    body,
  });
  return res.data;
}

export async function updateAddress(
  id: string,
  body: Partial<AddressPayload>,
): Promise<SavedAddress> {
  const res = await dashboardApi.put<Envelope<SavedAddress>>(
    `/addresses/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await dashboardApi.delete(`/addresses/${id}`);
}

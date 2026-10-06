import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CustomerProfile,
  CustomerProfileUpdate,
  Envelope,
} from "@/features/dashboard/customer/account/types";

export type {
  CustomerProfile,
  CustomerProfileUpdate,
  CustomerGender,
} from "@/features/dashboard/customer/account/types";

export { toProfileError } from "@/features/dashboard/customer/account/utils";

const noStore = { cache: "no-store" as const };

export async function fetchCustomerProfile(): Promise<CustomerProfile> {
  const res = await dashboardApi.get<Envelope<CustomerProfile>>(
    "/customer/profile",
    noStore,
  );
  return res.data;
}

export async function saveCustomerProfile(
  body: CustomerProfileUpdate,
): Promise<CustomerProfile> {
  const res = await dashboardApi.patch<Envelope<CustomerProfile>>(
    "/customer/profile",
    { body },
  );
  return res.data;
}

export const updateCustomerProfile = saveCustomerProfile;

/**
 * Authenticated vendor shop profile GET/PATCH. Dashboard client only.
 * Customer profile lives in `@/features/dashboard/customer/account/api/profile`.
 */
import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";

type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type VendorProfileUpdate = {
  shopName?: string;
  description?: string;
  logo?: string;
  logoPublicId?: string;
  phone?: string;
};

export type VendorProfile = {
  id: string;
  shopName?: string | null;
  shopSlug: string;
  description?: string | null;
  logo?: string | null;
  logoPublicId?: string | null;
  phone?: string | null;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchVendorProfile(): Promise<VendorProfile> {
  const res = await dashboardApi.get<Envelope<VendorProfile>>(
    "/vendor/profile",
    { cache: "no-store" },
  );
  return res.data;
}

export async function updateVendorProfile(
  body: VendorProfileUpdate,
): Promise<VendorProfile> {
  const res = await dashboardApi.patch<Envelope<VendorProfile>>(
    "/vendor/profile",
    { body },
  );
  return res.data;
}

export function toProfileError(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

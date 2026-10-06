import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CouponListItem,
  CouponListParams,
  CouponListResult,
  CreateCouponBody,
  Envelope,
} from "@/features/dashboard/admin/coupons/types";

export type {
  Envelope,
  CouponStatus,
  DiscountType,
  CouponListItem,
  CouponPagination,
  CouponListResult,
  CouponListParams,
  CreateCouponBody,
} from "@/features/dashboard/admin/coupons/types";

export {
  COUPON_STATUSES,
  DISCOUNT_TYPES,
} from "@/features/dashboard/admin/coupons/types";

export { toCouponErrorMessage } from "@/features/dashboard/admin/coupons/utils";

const noStore = { cache: "no-store" as const };

export async function fetchCouponList(
  params: CouponListParams = {},
): Promise<CouponListResult> {
  const res = await dashboardApi.get<Envelope<CouponListResult>>(
    "/admin/coupons",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search || undefined,
      },
    },
  );
  return res.data;
}

export async function createCoupon(
  body: CreateCouponBody,
): Promise<CouponListItem> {
  const res = await dashboardApi.post<Envelope<CouponListItem>>(
    "/admin/coupons",
    { body },
  );
  return res.data;
}

export async function updateCoupon(
  id: string,
  body: Partial<CreateCouponBody>,
): Promise<CouponListItem> {
  const res = await dashboardApi.put<Envelope<CouponListItem>>(
    `/admin/coupons/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteCoupon(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/coupons/${id}`);
}

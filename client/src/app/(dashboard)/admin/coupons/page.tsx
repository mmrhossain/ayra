import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchCouponList,
  toCouponErrorMessage,
} from "@/features/dashboard/admin/coupons/api/coupons";
import { CouponTable } from "@/features/dashboard/admin/coupons/components/coupon-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await requireAdminPageAccess("/admin/coupons");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchCouponList({ page: 1, limit: 20 });
  } catch (err) {
    error = toCouponErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Coupons" />
      {error || !initial ? (
        <PageError
          title="Could not load coupons"
          message={error ?? "Unknown error"}
        />
      ) : (
        <CouponTable initialData={initial} />
      )}
    </section>
  );
}

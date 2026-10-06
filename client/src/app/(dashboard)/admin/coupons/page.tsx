import {
  fetchCouponList,
  toCouponErrorMessage,
} from "@/features/dashboard/admin/coupons/api/coupons";
import { CouponTable } from "@/features/dashboard/admin/coupons/components/coupon-table";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchCouponList({ page: 1, limit: 20 });
  } catch (err) {
    error = toCouponErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
        {/* <p className="text-sm text-muted-foreground">
          Discount codes from the live backend.
        </p> */}
      </div>
      {error || !initial ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold">Could not load coupons</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        </div>
      ) : (
        <CouponTable initialData={initial} />
      )}
    </section>
  );
}

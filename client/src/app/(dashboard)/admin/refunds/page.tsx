import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { RefundTable } from "@/features/dashboard/admin/refunds/components/refund-table";
import {
  fetchRefundList,
  toPaymentErrorMessage,
} from "@/features/dashboard/admin/payments/api/payments";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  await requireAdminPageAccess("/admin/refunds");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchRefundList({ page: 1, limit: 20 });
  } catch (err) {
    error = toPaymentErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Refunds"
        description="Review and settle customer refunds."
      />
      {error || !initial ? (
        <PageError
          title="Could not load refunds"
          message={error ?? "Unknown error"}
        />
      ) : (
        <RefundTable initialData={initial} />
      )}
    </section>
  );
}

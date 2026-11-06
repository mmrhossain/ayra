import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { PaymentTable } from "@/features/dashboard/admin/payments/components/payment-table";
import {
  fetchPaymentList,
  toPaymentErrorMessage,
} from "@/features/dashboard/admin/payments/api/payments";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdminPageAccess("/admin/payments");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchPaymentList({ page: 1, limit: 20 });
  } catch (err) {
    error = toPaymentErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Payments"
        description="Transactions from the live backend."
      />
      {error || !initial ? (
        <PageError
          title="Could not load payments"
          message={error ?? "Unknown error"}
        />
      ) : (
        <PaymentTable initialData={initial} />
      )}
    </section>
  );
}

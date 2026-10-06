import { PaymentTable } from "@/features/dashboard/admin/payments/components/payment-table";
import {
  fetchPaymentList,
  toPaymentErrorMessage,
} from "@/features/dashboard/admin/payments/api/payments";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchPaymentList({ page: 1, limit: 20 });
  } catch (err) {
    error = toPaymentErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Transactions from the live backend.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <PaymentTable initialData={initial} />
      )}
    </section>
  );
}

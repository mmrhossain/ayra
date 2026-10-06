import { ReturnTable } from "@/features/dashboard/admin/return/components/return-table";
import {
  fetchReturnRequests,
  toOrderErrorMessage,
} from "@/features/dashboard/admin/orders/api/orders";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchReturnRequests({ page: 1, limit: 20 });
  } catch (err) {
    error = toOrderErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Returns</h1>
        <p className="text-sm text-muted-foreground">
          Review customer return requests.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load returns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <ReturnTable initialData={initial} />
      )}
    </section>
  );
}

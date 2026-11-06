import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ReturnTable } from "@/features/dashboard/admin/return/components/return-table";
import {
  fetchReturnRequests,
  toOrderErrorMessage,
} from "@/features/dashboard/admin/orders/api/orders";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  await requireAdminPageAccess("/admin/returns");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchReturnRequests({ page: 1, limit: 20 });
  } catch (err) {
    error = toOrderErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Returns"
        description="Review customer return requests."
      />
      {error || !initial ? (
        <PageError
          title="Could not load returns"
          message={error ?? "Unknown error"}
        />
      ) : (
        <ReturnTable initialData={initial} />
      )}
    </section>
  );
}

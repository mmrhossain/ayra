import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchOrderList,
  toOrderErrorMessage,
} from "@/features/dashboard/admin/orders/api/orders";
import { OrderTable } from "@/features/dashboard/admin/orders/components/order-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ search?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdminPageAccess("/admin/orders");
  const { search } = await searchParams;
  const initialSearch = typeof search === "string" ? search.trim() : "";
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchOrderList({
      page: 1,
      limit: 20,
      search: initialSearch || undefined,
    });
  } catch (err) {
    error = toOrderErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Orders" />
      {error || !initial ? (
        <PageError
          title="Could not load orders"
          message={error ?? "Unknown error"}
        />
      ) : (
        <OrderTable initialData={initial} initialSearch={initialSearch} />
      )}
    </section>
  );
}

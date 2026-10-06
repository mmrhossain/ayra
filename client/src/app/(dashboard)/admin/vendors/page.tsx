import { VendorTable } from "@/features/dashboard/admin/vendors/components/vendor-table";
import {
  fetchAdminUserList,
  toUserErrorMessage,
} from "@/features/dashboard/admin/customers/api/customer";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminUserList({
      page: 1,
      limit: 20,
      role: "VENDOR",
    });
  } catch (err) {
    error = toUserErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
        <p className="text-sm text-muted-foreground">
          Vendor accounts from GET /api/v1/admin/users?role=VENDOR.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load vendors</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <VendorTable initialData={initial} />
      )}
    </section>
  );
}

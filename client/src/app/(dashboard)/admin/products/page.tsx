import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ProductTable } from "@/features/dashboard/admin/products/components/product-table";
import {
  fetchProductList,
  toErrorMessage,
} from "@/features/dashboard/admin/products/api/products";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPageAccess("/admin/products");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchProductList({
      page: 1,
      limit: 20,
      includeInactive: true,
    });
  } catch (err) {
    error = toErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Products"
        description="Create products, then set stock in Inventory."
      />
      {error || !initial ? (
        <PageError
          title="Could not load products"
          message={error ?? "Unknown error"}
        />
      ) : (
        <ProductTable initialData={initial} />
      )}
    </section>
  );
}

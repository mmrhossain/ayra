import { ProductTable } from "@/features/dashboard/admin/products/components/product-table";
import {
  fetchProductList,
  toErrorMessage,
} from "@/features/dashboard/admin/products/api/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Create products, then set stock in Inventory.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <ProductTable initialData={initial} />
      )}
    </section>
  );
}

import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ProductIndexContent } from "@/features/dashboard/admin/products/components/product-index-content";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPageAccess("/admin/products");
  return <ProductIndexContent />;
}

import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ProductWizard } from "@/features/dashboard/admin/products/components/product-wizard";

export default async function AdminNewProductPage() {
  await requireAdminPageAccess("/admin/products");
  return <ProductWizard mode="create" />;
}

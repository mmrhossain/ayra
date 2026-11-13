import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ProductWizard } from "@/features/dashboard/admin/products/components/product-wizard";
import { ProductWizardSheet } from "@/features/dashboard/admin/products/components/product-wizard-sheet";

export default async function AdminNewProductModalPage() {
  await requireAdminPageAccess("/admin/products");
  return (
    <ProductWizardSheet>
      <ProductWizard mode="create" closeOnSuccess />
    </ProductWizardSheet>
  );
}

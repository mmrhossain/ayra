import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ProductWizard } from "@/features/dashboard/admin/products/components/product-wizard";
import { ProductWizardSheet } from "@/features/dashboard/admin/products/components/product-wizard-sheet";
import { ProductIndexContent } from "@/features/dashboard/admin/products/components/product-index-content";

export default async function AdminNewProductPage() {
  await requireAdminPageAccess("/admin/products");
  return (
    <>
      <ProductIndexContent />
      <ProductWizardSheet fallbackHref="/admin/products">
        <ProductWizard mode="create" />
      </ProductWizardSheet>
    </>
  );
}

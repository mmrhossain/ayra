import { fetchTaxClasses } from "@/features/dashboard/admin/products/api/tax-classes";
import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { TaxClassesPanel } from "@/features/dashboard/admin/products/components/tax-classes-panel";
export default async function TaxClassesPage() {
  await requireAdminPageAccess("/admin/tax-classes");
  const initialData = await fetchTaxClasses();
  return <TaxClassesPanel initialData={initialData} />;
}

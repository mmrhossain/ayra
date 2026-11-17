import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { TaxClassesPanel } from "@/features/dashboard/admin/products/components/tax-classes-panel";
export default async function TaxClassesPage() {
  await requireAdminPageAccess("/admin/tax-classes");
  return <TaxClassesPanel />;
}

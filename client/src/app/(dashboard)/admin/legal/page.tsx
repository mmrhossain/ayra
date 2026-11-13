import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { LegalTabs } from "@/features/dashboard/admin/legal/components/legal-tabs";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  await requireAdminPageAccess("/admin/legal");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Legal"
        description="Privacy and terms documents. Publish a draft to show it on the storefront."
      />
      <LegalTabs />
    </section>
  );
}

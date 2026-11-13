import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { SettingsPageContent } from "@/features/dashboard/admin/settings/components/settings-page-content";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPageAccess("/admin/settings");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Store, payment, and checkout configuration. Changes take effect within 30 seconds across the API."
      />
      <SettingsPageContent />
    </section>
  );
}

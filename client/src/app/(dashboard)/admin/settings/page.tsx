import { fetchAdminSettings } from "@/features/dashboard/admin/settings/api/settings";
import { requireAdminPageAccess, toAdminAccess } from "@/lib/api/auth/server";
import { hasAdminAction } from "@/lib/admin-permissions";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { SettingsPageContent } from "@/features/dashboard/admin/settings/components/settings-page-content";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdminPageAccess("/admin/settings");
  const access = toAdminAccess(session.user);
  const initialData = await fetchAdminSettings();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Store, payment, and checkout configuration. Changes take effect within 30 seconds across the API."
      />
      <SettingsPageContent
        initialData={initialData}
        canWrite={hasAdminAction(access, "settings:write")}
        canEditPayment={hasAdminAction(access, "settings:secrets")}
      />
    </section>
  );
}

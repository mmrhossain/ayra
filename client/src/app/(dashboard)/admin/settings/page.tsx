import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { SettingsTabs } from "@/features/dashboard/admin/settings/components/settings-tabs";
import { fetchAdminSettings } from "@/features/dashboard/admin/settings/api/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPageAccess("/admin/settings");
  let groups;
  let error: string | null = null;

  try {
    groups = await fetchAdminSettings();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load settings";
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Store, payment, and checkout configuration. Changes take effect within 30 seconds across the API."
      />
      {error || !groups ? (
        <PageError
          title="Could not load settings"
          message={error ?? "Unknown error"}
        />
      ) : (
        <SettingsTabs groups={groups} />
      )}
    </section>
  );
}

import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { LegalTabs } from "@/features/dashboard/admin/legal/components/legal-tabs";
import {
  fetchLegalList,
  toLegalErrorMessage,
} from "@/features/dashboard/admin/legal/api/legal";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  await requireAdminPageAccess("/admin/legal");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchLegalList({ page: 1, limit: 20 });
  } catch (err) {
    error = toLegalErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Legal"
        description="Privacy and terms documents. Publish a draft to show it on the storefront."
      />
      {error || !initial ? (
        <PageError
          title="Could not load legal documents"
          message={error ?? "Unknown error"}
        />
      ) : (
        <LegalTabs initialData={initial} />
      )}
    </section>
  );
}

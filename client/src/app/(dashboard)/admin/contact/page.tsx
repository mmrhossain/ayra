import { fetchContactMessages, toContactMessageErrorMessage } from "@/features/dashboard/admin/contact-messages/api/contact-messages";
import { ContactMessageTable } from "@/features/dashboard/admin/contact-messages/components/contact-message-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { requireAdminPageAccess } from "@/lib/api/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  await requireAdminPageAccess("/admin/contact");
  let initialData;
  let error: string | null = null;

  try {
    initialData = await fetchContactMessages({ page: 1, limit: 20 });
  } catch (loadError) {
    error = toContactMessageErrorMessage(loadError);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Contact messages"
        description="Review and track messages submitted through the storefront contact form."
      />
      {error || !initialData ? (
        <PageError title="Could not load contact messages" message={error ?? "Unknown error"} />
      ) : (
        <ContactMessageTable initialData={initialData} />
      )}
    </section>
  );
}

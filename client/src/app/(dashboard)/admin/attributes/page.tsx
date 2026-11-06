import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { AttributeTable } from "@/features/dashboard/admin/attributes/components/attribute-table";
import {
  fetchAttributeList,
  toAttributeErrorMessage,
} from "@/features/dashboard/admin/attributes/api/attributes";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  await requireAdminPageAccess("/admin/attributes");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAttributeList();
  } catch (err) {
    error = toAttributeErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Attributes"
        description="Product attributes and values used by variants."
      />
      {error || !initial ? (
        <PageError
          title="Could not load attributes"
          message={error ?? "Unknown error"}
        />
      ) : (
        <AttributeTable initialData={initial} />
      )}
    </section>
  );
}

import { AttributeTable } from "@/features/dashboard/admin/attributes/components/attribute-table";
import {
  fetchAttributeList,
  toAttributeErrorMessage,
} from "@/features/dashboard/admin/attributes/api/attributes";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAttributeList();
  } catch (err) {
    error = toAttributeErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attributes</h1>
        <p className="text-sm text-muted-foreground">
          Product attributes and values used by variants.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load attributes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <AttributeTable initialData={initial} />
      )}
    </section>
  );
}

import { LegalTable } from "@/features/dashboard/admin/legal/components/legal-table";
import {
  fetchLegalList,
  toLegalErrorMessage,
} from "@/features/dashboard/admin/legal/api/legal";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchLegalList({ page: 1, limit: 20 });
  } catch (err) {
    error = toLegalErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Legal</h1>
        <p className="text-sm text-muted-foreground">
          Privacy and terms documents. Publish a draft to show it on the storefront.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load legal documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <LegalTable initialData={initial} />
      )}
    </section>
  );
}

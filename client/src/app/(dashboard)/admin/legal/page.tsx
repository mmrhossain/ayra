import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { fetchLegalList } from "@/features/dashboard/admin/legal/api/legal";
import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { LegalTabs } from "@/features/dashboard/admin/legal/components/legal-tabs";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPageAccess("/admin/legal");
  const { tab } = await searchParams;
  const type = tab === "privacy" ? "PRIVACY" : tab === "terms" ? "TERMS" : "";
  const client = new QueryClient();
  await client.fetchQuery({
    queryKey: ["admin-legal", 1, type],
    queryFn: () => fetchLegalList({ page: 1, limit: 20, type: type || undefined }),
    staleTime: 30_000,
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Legal"
        description="Privacy and terms documents. Publish a draft to show it on the storefront."
      />
      <HydrationBoundary state={dehydrate(client)}><LegalTabs /></HydrationBoundary>
    </section>
  );
}

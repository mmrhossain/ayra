import { fetchCollections } from "@/features/dashboard/admin/collections/api";
import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { CollectionsPanel } from "@/features/dashboard/admin/collections/collections-panel";
export default async function CollectionsPage() {
  await requireAdminPageAccess("/admin/collections");
  const initialData = await fetchCollections(1);
  return <CollectionsPanel initialData={initialData} />;
}

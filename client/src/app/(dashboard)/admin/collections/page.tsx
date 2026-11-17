import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { CollectionsPanel } from "@/features/dashboard/admin/collections/collections-panel";
export default async function CollectionsPage() {
  await requireAdminPageAccess("/admin/collections");
  return <CollectionsPanel />;
}

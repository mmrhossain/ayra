import { fetchNotifications } from "@/features/notifications/api/notifications";
import { requireAdminPageAccess } from "@/lib/api/auth/server";

import { NotificationsPage } from "@/features/notifications/components/notifications-page";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireAdminPageAccess("/admin/notifications");
  const initialData = await fetchNotifications({ page: 1, limit: 50 }).catch(
    () => undefined,
  );

  return <NotificationsPage initialData={initialData} />;
}

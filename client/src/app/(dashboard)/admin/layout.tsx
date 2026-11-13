import { DashboardShell } from "@/features/dashboard/admin/shared/components/dashboard-shell";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { getFirstPermittedAdminHref } from "@/lib/admin-navigation";
import { requireRole, toAdminAccess } from "@/lib/api/auth/server";
import {
  SIDEBAR_COOKIE_NAME,
  parseSidebarOpen,
} from "@/lib/sidebar-preferences";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");
  const access = toAdminAccess(session.user);

  const cookieStore = await cookies();
  const defaultOpen = parseSidebarOpen(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
  );
  const homeHref = getFirstPermittedAdminHref(access) ?? "/unauthorized";
  const publicSettings = await fetchPublicSettingsOrDefault();

  return (
    <DashboardShell
      defaultOpen={defaultOpen}
      access={access}
      homeHref={homeHref}
      initialPublicSettings={publicSettings}
    >
      {children}
    </DashboardShell>
  );
}

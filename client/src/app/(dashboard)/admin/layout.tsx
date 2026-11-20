import { DashboardShell } from "@/features/dashboard/admin/shared/components/dashboard-shell";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { getFirstPermittedAdminHref } from "@/lib/admin-navigation";
import { requireRole, toAdminAccess } from "@/lib/api/auth/server";
import {
  SIDEBAR_COOKIE_NAME,
  parseSidebarOpen,
} from "@/lib/sidebar-preferences";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore, publicSettings] = await Promise.all([
    requireRole("ADMIN"),
    cookies(),
    fetchPublicSettingsOrDefault(),
  ]);
  const access = toAdminAccess(session.user);

  const defaultOpen = parseSidebarOpen(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
  );
  const homeHref = getFirstPermittedAdminHref(access) ?? "/unauthorized";

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

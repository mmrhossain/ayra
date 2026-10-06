import { DashboardShell } from "@/features/dashboard/admin/shared/components/dashboard-shell";
import { requireRole } from "@/lib/api/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return <DashboardShell>{children}</DashboardShell>;
}

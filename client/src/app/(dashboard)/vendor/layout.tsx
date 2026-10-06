import { DashboardShell } from "@/features/dashboard/admin/shared/components/dashboard-shell";
import { requireRole } from "@/lib/api/auth/server";

export const dynamic = "force-dynamic";

export default async function VendorAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("VENDOR");

  return <DashboardShell>{children}</DashboardShell>;
}

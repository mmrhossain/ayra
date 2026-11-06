"use client";

import { useTheme } from "next-themes";
import { Suspense, useEffect } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/admin/shared/components/dashboard-sidebar";
import type { AdminAccess } from "@/lib/admin-permissions";
import { DashboardTopbar } from "@/features/dashboard/admin/shared/components/dashboard-topbar";
import { StaffShoppingNotice } from "@/features/dashboard/admin/shared/components/staff-shopping-notice";
import { DashboardQueryProvider } from "@/features/dashboard/admin/shared/components/query-provider";
import { ThemeProvider } from "@/hooks/theme-provider";

// Dark mode is scoped to the admin dashboard. next-themes writes the class to
// <html>, so we explicitly clear it when the admin shell unmounts (e.g. when the
// user navigates back to the storefront).
function AdminThemeScope() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const dark = resolvedTheme === "dark";

    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";

    return () => {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    };
  }, [resolvedTheme]);

  return null;
}

interface DashboardShellProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  access?: AdminAccess;
  homeHref?: string;
}

const EMPTY_ACCESS: AdminAccess = {
  role: "ADMIN",
  isSuperAdmin: false,
  adminPermissions: [],
  adminActions: [],
  staffStatus: "ACTIVE",
};

export function DashboardShell({
  children,
  defaultOpen = true,
  access = EMPTY_ACCESS,
  homeHref = "/admin",
}: DashboardShellProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="dashboard-theme"
    >
      <AdminThemeScope />
      <DashboardQueryProvider>
        {/* defaultOpen এ সার্ভারের কুকি স্টেট পাস করা হলো */}
        <SidebarProvider defaultOpen={defaultOpen} className="bg-background text-foreground">
          <Suspense fallback={null}>
            <DashboardSidebar access={access} homeHref={homeHref} />
          </Suspense>
          <SidebarInset className="min-w-0">
            <DashboardTopbar />
            <div className="min-w-0 flex-1 overflow-x-auto bg-background p-4 text-foreground sm:p-6">
              <Suspense fallback={null}>
                <StaffShoppingNotice />
              </Suspense>
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DashboardQueryProvider>
    </ThemeProvider>
  );
}

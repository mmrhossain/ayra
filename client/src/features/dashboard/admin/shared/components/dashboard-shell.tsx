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
import { DEFAULT_PUBLIC_SETTINGS } from "@/features/settings/defaults";
import { PublicSettingsProvider } from "@/features/settings/public-settings-provider";
import type { PublicSettings } from "@/features/settings/types";

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
  initialPublicSettings?: PublicSettings;
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
  initialPublicSettings = DEFAULT_PUBLIC_SETTINGS,
}: DashboardShellProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="dashboard-theme"
    >
      <AdminThemeScope />
      <style jsx global>{`
        @keyframes admin-sidebar-enter-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes admin-sidebar-exit-left {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        @keyframes admin-sidebar-enter-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes admin-sidebar-exit-right {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .admin-mobile-sidebar[data-state="open"][data-side="left"] {
          animation: admin-sidebar-enter-left 200ms ease-out both;
        }
        .admin-mobile-sidebar[data-state="closed"][data-side="left"] {
          animation: admin-sidebar-exit-left 180ms ease-in both;
        }
        .admin-mobile-sidebar[data-state="open"][data-side="right"] {
          animation: admin-sidebar-enter-right 200ms ease-out both;
        }
        .admin-mobile-sidebar[data-state="closed"][data-side="right"] {
          animation: admin-sidebar-exit-right 180ms ease-in both;
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-mobile-sidebar { animation: none !important; }
        }
      `}</style>
      <DashboardQueryProvider>
        <PublicSettingsProvider initialSettings={initialPublicSettings}>
          <SidebarProvider defaultOpen={defaultOpen} className="bg-background text-foreground">
            <Suspense fallback={null}>
              <DashboardSidebar access={access} homeHref={homeHref} />
            </Suspense>
            <SidebarInset className="min-w-0">
              <DashboardTopbar />
              <div className="min-w-0 flex-1 bg-background p-4 text-foreground sm:p-6">
                <Suspense fallback={null}>
                  <StaffShoppingNotice />
                </Suspense>
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </PublicSettingsProvider>
      </DashboardQueryProvider>
    </ThemeProvider>
  );
}

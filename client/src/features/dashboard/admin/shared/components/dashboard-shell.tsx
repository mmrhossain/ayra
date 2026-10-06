"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { DashboardSidebar } from "@/features/dashboard/admin/shared/components/dashboard-sidebar";
import { DashboardTopbar } from "@/features/dashboard/admin/shared/components/dashboard-topbar";
import { DashboardQueryProvider } from "@/features/dashboard/admin/shared/components/query-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/hooks/theme-provider";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/vendor/pending")) {
    return <>{children}</>;
  }

  return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="dashboard-theme">
        <DashboardQueryProvider>
          <SidebarProvider className="bg-background text-foreground">
            <Suspense fallback={null}>
              <DashboardSidebar />
            </Suspense>
            <SidebarInset className="min-w-0">
              <DashboardTopbar />
              <div className="min-w-0 flex-1 overflow-x-auto bg-background p-4 text-foreground sm:p-6">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </DashboardQueryProvider>
      </ThemeProvider>
  );
}

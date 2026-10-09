"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/admin/shared/components/dashboard-sidebar";
import { DashboardTopbar } from "@/features/dashboard/admin/shared/components/dashboard-topbar";
import { DashboardQueryProvider } from "@/features/dashboard/admin/shared/components/query-provider";
import { ThemeProvider } from "@/hooks/theme-provider";

interface DashboardShellProps {
  children: React.ReactNode;
  defaultOpen?: boolean; // কুকি থেকে আসা স্ট্যাটাস রিসিভ করার জন্য
}

export function DashboardShell({ children, defaultOpen = true }: DashboardShellProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/vendor/pending")) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="dashboard-theme"
    >
      <DashboardQueryProvider>
        {/* defaultOpen এ সার্ভারের কুকি স্টেট পাস করা হলো */}
        <SidebarProvider defaultOpen={defaultOpen} className="bg-background text-foreground">
          <Suspense fallback={null}>
            <DashboardSidebar />
          </Suspense>
          <SidebarInset className="min-w-0">
            <DashboardTopbar />
            <div className="min-w-0 flex-1 overflow-x-auto bg-background p-4 text-foreground sm:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DashboardQueryProvider>
    </ThemeProvider>
  );
}

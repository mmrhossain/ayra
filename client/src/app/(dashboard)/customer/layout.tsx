import { DashboardQueryProvider } from "@/features/dashboard/admin/shared/components/query-provider";
import Sidebar from "@/features/dashboard/customer/shared/components/Sidebar";
import TopHero from "@/features/dashboard/customer/shared/components/TopHero";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { PublicSettingsProvider } from "@/features/settings/public-settings-provider";
import { requireCustomer } from "@/lib/api/auth/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  await requireCustomer();
  const publicSettings = await fetchPublicSettingsOrDefault();

  return (
    <DashboardQueryProvider>
      <PublicSettingsProvider initialSettings={publicSettings}>
        <div className="min-h-dvh w-full min-w-0 bg-bg-primary pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-20">
          <TopHero />

          <div className="container mt-6 md:mt-12">
            <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to store
              </Link>
              <NotificationBell viewAllHref="/customer/notifications" />
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start md:gap-8">
              <aside className="w-full lg:sticky lg:top-24 lg:w-72">
                <Sidebar />
              </aside>

              <main className="min-h-[420px] min-w-0 flex-1 overflow-x-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 md:min-h-[600px]">
                <div className="p-4 sm:p-5 md:p-8 lg:p-10">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </PublicSettingsProvider>
    </DashboardQueryProvider>
  );
}

import FooterNavigationMenu from "@/components/layout/FooterNavigation-menu";
import Header from "@/components/layout/Header";
import HeaderHeightObserver from "@/components/layout/HeaderHeightObserver";
import CustomerNavbar from "@/features/dashboard/customer/shared/components/CustomerNavbar";
import { getCategories } from "@/features/catalog/api";
import { unstable_rethrow } from "next/navigation";
import { DashboardQueryProvider } from "@/features/dashboard/admin/shared/components/query-provider";
import Sidebar from "@/features/dashboard/customer/shared/components/Sidebar";
import TopHero from "@/features/dashboard/customer/shared/components/TopHero";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { PublicSettingsProvider } from "@/features/settings/public-settings-provider";
import { requireCustomer } from "@/lib/api/auth/server";
import { ReactNode } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Layout({ children }: { children: ReactNode }) {
  await requireCustomer();
  const [publicSettings, categories] = await Promise.all([
    fetchPublicSettingsOrDefault(),
    getCategories()
      .then(data => Array.isArray(data) ? data : [])
      .catch(error => { unstable_rethrow(error); return []; }),
  ]);

  return (
    <DashboardQueryProvider>
      <PublicSettingsProvider initialSettings={publicSettings}>
        <div className="min-h-dvh w-full min-w-0 bg-bg-primary pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-20">
          <HeaderHeightObserver />
          <Header />
          <CustomerNavbar categories={categories} />
          <TopHero />

          <div className="container mt-6 md:mt-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start md:gap-8">
              <aside className="w-full lg:sticky lg:top-24 lg:w-72">
                <Sidebar />
              </aside>

              <main className="min-h-[420px] min-w-0 flex-1 overflow-x-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 md:min-h-[600px]">
                <div className="p-4 sm:p-5 md:p-8 lg:p-10">{children}</div>
              </main>
            </div>
          </div>
          <FooterNavigationMenu categories={categories} />
        </div>
      </PublicSettingsProvider>
    </DashboardQueryProvider>
  );
}

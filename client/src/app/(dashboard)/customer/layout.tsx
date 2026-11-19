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
        <div className="min-h-dvh w-full min-w-0 bg-bg-primary pb-[calc(var(--bottom-nav-space)+var(--storefront-section-gap))]">
          <HeaderHeightObserver />
          <Header />
          <CustomerNavbar categories={categories} />
          <TopHero />

          <div className="container storefront-page-start">
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:gap-8">
              <aside className="w-full lg:sticky lg:top-[calc(var(--navbar-height,68px)+1rem)] lg:w-72 lg:shrink-0">
                <Sidebar />
              </aside>

              <main className="min-w-0 flex-1 overflow-x-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
              </main>
            </div>
          </div>
          <FooterNavigationMenu categories={categories} initialIsCustomer />
        </div>
      </PublicSettingsProvider>
    </DashboardQueryProvider>
  );
}

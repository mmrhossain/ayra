import { DashboardQueryProvider } from "@/features/dashboard/admin/shared/components/query-provider";
import Sidebar from "@/features/dashboard/customer/shared/components/Sidebar";
import TopHero from "@/features/dashboard/customer/shared/components/TopHero";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <DashboardQueryProvider>
      <div className="min-h-dvh w-full min-w-0 bg-[#F8FAFC] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-20">
        <TopHero />

        <div className="container mt-6 md:mt-12">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:items-start">
            <aside className="w-full lg:w-72 lg:sticky lg:top-24">
              <Sidebar />
            </aside>

            <main className="min-h-[420px] min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 md:min-h-[600px]">
              <div className="p-4 sm:p-5 md:p-8 lg:p-10">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </DashboardQueryProvider>
  );
}

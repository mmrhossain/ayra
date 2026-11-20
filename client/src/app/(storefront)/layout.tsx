import Footer from "@/components/layout/Footer";
import FooterNavigationMenu from "@/components/layout/FooterNavigation-menu";
import Header from "@/components/layout/Header";
import HeaderHeightObserver from "@/components/layout/HeaderHeightObserver";
import Navbar from "@/components/layout/Navbar";
import StorefrontProvider from "@/components/providers/StorefrontProvider";
import { getCategories } from "@/features/catalog/api";
import { CategoryListItem } from "@/features/catalog/types";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import StorefrontDeferredWidgets from "@/features/content/components/chat/StorefrontDeferredWidgets";
import { redirectStaffFromStorefront } from "@/lib/api/auth/server";
import { normalizeRole } from "@/lib/api/auth/roles";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const categoriesPromise = getCategories()
    .then((data) => (Array.isArray(data) ? data : []))
    .catch((): CategoryListItem[] => []);
  const [session, categories, publicSettings] = await Promise.all([
    redirectStaffFromStorefront(),
    categoriesPromise,
    fetchPublicSettingsOrDefault(),
  ]);
  const initialIsCustomer = normalizeRole(session?.user?.role) === "CUSTOMER";

  return (
    <StorefrontProvider initialPublicSettings={publicSettings}>
      <div className="min-w-0">
        <HeaderHeightObserver />
        <Header />
        <Navbar categories={categories} initialIsCustomer={initialIsCustomer} />
        <StorefrontDeferredWidgets />
        <div className="min-h-[calc(100svh-var(--header-height,112px))]" data-storefront-content>
          {children}
        </div>
        <Footer />
        <FooterNavigationMenu categories={categories} initialIsCustomer={initialIsCustomer} />
      </div>
    </StorefrontProvider>
  );
}

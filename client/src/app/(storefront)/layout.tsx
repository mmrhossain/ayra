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

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  await redirectStaffFromStorefront();

  const categoriesPromise = getCategories()
    .then((data) => (Array.isArray(data) ? data : []))
    .catch((): CategoryListItem[] => []);
  const [categories, publicSettings] = await Promise.all([
    categoriesPromise,
    fetchPublicSettingsOrDefault(),
  ]);

  return (
    <StorefrontProvider initialPublicSettings={publicSettings}>
      <div className="min-w-0">
        <HeaderHeightObserver />
        <Header />
        <Navbar categories={categories} />
        <StorefrontDeferredWidgets />
        {children}
        <Footer />
        <FooterNavigationMenu categories={categories} />
      </div>
    </StorefrontProvider>
  );
}

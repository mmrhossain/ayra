import Footer from "@/components/layout/Footer";
import FooterNavigationMenu from "@/components/layout/FooterNavigation-menu";
import Header from "@/components/layout/Header";
import HeaderHeightObserver from "@/components/layout/HeaderHeightObserver"; // Import it here
import Navbar from "@/components/layout/Navbar";
import StorefrontProvider from "@/components/providers/StorefrontProvider";
import SocialContact from "@/components/shared/SocialContact";
import { getCategories } from "@/features/catalog/api";
import { CategoryListItem } from "@/features/catalog/types";
import StorefrontChat from "@/features/content/components/chat/StorefrontChat";
import { redirectStaffFromStorefront } from "@/lib/api/auth/server";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  await redirectStaffFromStorefront();

  let categories: CategoryListItem[] = [];

  try {
    const data = await getCategories();
    if (Array.isArray(data)) {
      categories = data;
    }
  } catch {
    categories = [];
  }

  return (
    <StorefrontProvider>
      <div className="min-w-0">
        <HeaderHeightObserver /> {/* Measures Header + Navbar combined */}
        <Header />
        <Navbar categories={categories} />
        <SocialContact />
        <StorefrontChat />
        {children}
        <Footer />
        <FooterNavigationMenu categories={categories} />
      </div>
    </StorefrontProvider>
  );
}

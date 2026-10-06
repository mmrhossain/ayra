import Footer from "@/components/layout/Footer";
import FooterNavigationMenu from "@/components/layout/FooterNavigation-menu";
import Header from "@/components/layout/Header";
import HeaderHeightObserver from "@/components/layout/HeaderHeightObserver"; // Import it here
import Navbar from "@/components/layout/Navbar";
import StorefrontProvider from "@/components/providers/StorefrontProvider";
import SocialContact from "@/components/shared/SocialContact";
import { getCategories } from "@/features/catalog/categories-api";
import { CategoryListItem } from "@/features/catalog/types";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  let categories: CategoryListItem[] = [];

  try {
    const data = await getCategories();
    if (Array.isArray(data)) {
      categories = data;
    }
  } catch (error) {
    console.error("Failed to fetch categories in layout:", error);
  }

  return (
    <StorefrontProvider>
      <div className="min-w-0">
        <HeaderHeightObserver /> {/* Measures Header + Navbar combined */}
        <Header />
        <Navbar categories={categories} />
        <SocialContact />
        {children}
        <Footer />
        <FooterNavigationMenu />
      </div>
    </StorefrontProvider>
  );
}

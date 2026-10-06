"use client";

import DeskTopNavbar from "@/components/layout/DesktopNavbar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { CategoryListItem } from "@/features/catalog/types";
import { useStorefrontCounts } from "@/hooks/useStorefrontCounts";

export default function Navbar({ categories }: { categories: CategoryListItem[] }) {
  useStorefrontCounts();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <MobileNavbar categories={categories} />
      <DeskTopNavbar categories={categories} />
    </nav>
  );
}

"use client";

import DeskTopNavbar from "@/components/layout/DesktopNavbar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { CategoryListItem } from "@/features/catalog/types";

export default function Navbar({ categories }: { categories: CategoryListItem[] }) {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <MobileNavbar />
      <DeskTopNavbar categories={categories} />
    </nav>
  );
}

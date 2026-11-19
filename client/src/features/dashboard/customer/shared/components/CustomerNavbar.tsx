"use client";

import Navbar from "@/components/layout/Navbar";
import type { CategoryListItem } from "@/features/catalog/types";
import { useStorefrontCounts } from "@/hooks/useStorefrontCounts";

export default function CustomerNavbar({ categories }: { categories: CategoryListItem[] }) {
  useStorefrontCounts();
  return <Navbar categories={categories} initialIsCustomer />;
}

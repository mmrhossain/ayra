import type { CategoryListItem, ProductListItem } from "@/features/catalog/types";
import type { SliderListItem } from "@/features/dashboard/admin/sliders/types";

export type HomeSectionSource =
  | "MANUAL"
  | "NEW_ARRIVALS"
  | "BEST_SELLERS"
  | "DISCOUNT"
  | "TRENDING"
  | "FEATURED";

export type HomeSection = {
  id: string;
  type: "PRODUCT_GRID";
  title: string;
  source: HomeSectionSource;
  href: string;
  products: ProductListItem[];
};

export type HomePayload = {
  sliders: SliderListItem[];
  categories: CategoryListItem[];
  sections: HomeSection[];
};

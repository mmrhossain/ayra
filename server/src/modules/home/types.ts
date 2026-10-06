import type { CollectionSource } from "../../generated/prisma/client.ts";

export type HomeProductCard = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  images: Array<{ imageUrl: string }>;
  variants: Array<{
    id: string;
    sku: string;
    price: unknown;
    compareAtPrice: unknown;
    isDefault: boolean;
    availableStock: number;
  }>;
};

export type HomeSection = {
  id: string;
  type: "PRODUCT_GRID";
  title: string;
  source: CollectionSource;
  href: string;
  products: HomeProductCard[];
};

export type HomeCategoryCard = {
  id: string;
  name: string;
  slug: string;
  parentSlug: string;
  image: string | null;
  isActive: boolean;
  parentId: string | null;
};

export type HomePayload = {
  sliders: unknown[];
  categories: HomeCategoryCard[];
  sections: HomeSection[];
};

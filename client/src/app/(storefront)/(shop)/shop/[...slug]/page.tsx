import Features from "@/components/shared/Features";
import { fetchCategories, type ProductSort } from "@/features/catalog/api";
import { getCategoryBySlug } from "@/features/catalog/categories-api";
import Subcategories from "@/features/catalog/components/category/Subcategories";
import ShopContent from "@/features/catalog/components/shop/ShopContent";
import DynamicFilterBar from "@/features/shop/layout/DynamicFilter";
import ProductsSkeleton from "@/skeleton/productsSkeleton";
import SubcategoriesSkeleton from "@/skeleton/SubcategoriesSkeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const SORTS = new Set<ProductSort>(["newest", "price_asc", "price_desc", "popular"]);

type SearchParams = {
  page?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
};

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const routeCategorySlug = slug?.length ? slug[slug.length - 1] : undefined;

  const categoryDetails = routeCategorySlug
    ? await getCategoryBySlug(routeCategorySlug).catch(() => null)
    : null;

  const categories = await fetchCategories().catch(() => []);

  const children = categoryDetails?.children ?? [];
  const hasChildren = children.length > 0;

  // ✅ FIX: Check actual product fields from API response
  const directProductsCount =
    categoryDetails?.productsCount ??
    categoryDetails?.products?.length ??
    categoryDetails?.totalProducts ??
    0;

  // Has direct products if count > 0, OR if we're at root /shop (categoryDetails is null)
  const hasProducts = directProductsCount > 0 || !categoryDetails;

  // Show Subcategories ONLY when category has NO direct products BUT HAS child categories
  const isPureCategoryHub = !hasProducts && hasChildren;

  // Build parent_category object
  const parent_category = {
    id: categoryDetails?.id,
    slug: categoryDetails?.slug,
    name: categoryDetails?.name ?? "Category",
    image: categoryDetails?.image ?? null,
    mobileImage: categoryDetails?.mobileImage ?? null,
    children: children,
  };

  const sort: ProductSort = SORTS.has(sp.sort as ProductSort) ? (sp.sort as ProductSort) : "newest";
  const minPriceRaw = Number(sp.minPrice);
  const minPrice = Number.isFinite(minPriceRaw) && minPriceRaw >= 0 ? minPriceRaw : undefined;
  const maxPriceRaw = Number(sp.maxPrice);
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : undefined;

  return (
    <div className="relative min-h-dvh min-w-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      {isPureCategoryHub ? (
        /* Scenario A: No direct products, only child categories -> Show Subcategories Grid */
        <Suspense fallback={<SubcategoriesSkeleton />}>
          <Subcategories subCategories={children} parent_category={parent_category} />
        </Suspense>
      ) : (
        /* Scenario B: Has direct products (even if it has subcategories) -> Direct Product Grid */
        <>
          <Suspense fallback={null}>
            <DynamicFilterBar categories={categories} />
          </Suspense>

          <Suspense
            fallback={
              <div className="container mt-8">
                <ProductsSkeleton />
              </div>
            }
          >
            <ShopContent slug={slug} sp={sp} sort={sort} minPrice={minPrice} maxPrice={maxPrice} />
          </Suspense>
        </>
      )}

      <Features />
    </div>
  );
}

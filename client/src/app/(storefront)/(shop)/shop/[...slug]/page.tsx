import Features from "@/components/shared/Features";
import {
  fetchProductFacets,
  getCategoryBySlug,
  parseAttributesParam,
  parseCategoriesParam,
  type ProductSort,
} from "@/features/catalog/api";
import Subcategories from "@/features/catalog/components/category/Subcategories";
import ShopContent from "@/features/catalog/components/shop/ShopContent";
import DynamicFilterBar from "@/features/shop/layout/DynamicFilter";
import ProductsSkeleton from "@/features/catalog/skeleton/ProductsSkeleton";
import SubcategoriesSkeleton from "@/features/catalog/skeleton/SubcategoriesSkeleton";
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
  attrs?: string;
  categories?: string;
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

  const routeCategoryPath = slug?.length ? slug.join("/") : undefined;

  const categoryDetails = routeCategoryPath
    ? await getCategoryBySlug(routeCategoryPath)
    : null;

  const children = categoryDetails?.children ?? [];
  const hasChildren = children.length > 0;

  const directProductsCount = categoryDetails?.productsCount ?? 0;

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

  const facets = isPureCategoryHub
    ? null
    : await fetchProductFacets({
        category: routeCategoryPath,
        search: sp.search,
        minPrice,
        maxPrice,
        attributes: parseAttributesParam(sp.attrs),
        categories: parseCategoriesParam(sp.categories),
      });

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
            <DynamicFilterBar facets={facets} />
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

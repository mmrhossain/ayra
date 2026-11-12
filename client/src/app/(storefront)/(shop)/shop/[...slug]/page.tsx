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

function FilterBarSkeleton() {
  return (
    <div
      className="h-14 border-b border-zinc-100 sm:h-16"
      aria-hidden="true"
    />
  );
}

async function ShopFilterBar({
  category,
  search,
  minPrice,
  maxPrice,
  attrs,
  categories,
}: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  attrs?: string;
  categories?: string;
}) {
  const facets = await fetchProductFacets({
    category,
    search,
    minPrice,
    maxPrice,
    attributes: parseAttributesParam(attrs),
    categories: parseCategoriesParam(categories),
  });

  return <DynamicFilterBar facets={facets} />;
}

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

  const hasProducts = directProductsCount > 0 || !categoryDetails;

  const isPureCategoryHub = !hasProducts && hasChildren;

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
        <Suspense fallback={<SubcategoriesSkeleton />}>
          <Subcategories subCategories={children} parent_category={parent_category} />
        </Suspense>
      ) : (
        <>
          <Suspense fallback={<FilterBarSkeleton />}>
            <ShopFilterBar
              category={routeCategoryPath}
              search={sp.search}
              minPrice={minPrice}
              maxPrice={maxPrice}
              attrs={sp.attrs}
              categories={sp.categories}
            />
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

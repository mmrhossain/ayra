import Features from "@/components/shared/Features";
import {
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
import { PUBLIC_SITE_URL, SITE_NAME } from "@/config/site";
import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";

const SORTS = new Set<ProductSort>(["newest", "price_asc", "price_desc", "popular"]);
const loadCategory = cache(getCategoryBySlug);

type SearchParams = {
  collection?: string;
  page?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  attrs?: string;
  categories?: string;
};

const INDEXING_FILTERS = new Set([
  "page",
  "category",
  "sort",
  "minPrice",
  "maxPrice",
  "search",
  "attrs",
  "categories",
  "collection",
]);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const categoryPath = slug?.join("/");
  const category = categoryPath ? await loadCategory(categoryPath) : null;
  const isFiltered = Object.keys(query).some((key) => INDEXING_FILTERS.has(key));
  const canonicalPath = categoryPath ? `/shop/${categoryPath}` : "/shop";

  if (categoryPath && !category) {
    return {
      title: `Category Not Found | ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const title = category?.name ? `${category.name} | ${SITE_NAME}` : `Shop | ${SITE_NAME}`;
  const description =
    category?.description?.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim() ||
    (category?.name
      ? `Shop ${category.name} at ${SITE_NAME}. Explore available products and find your favorites.`
      : `Explore products and shop online at ${SITE_NAME}.`);

  return {
    title,
    description: description.slice(0, 160),
    ...(PUBLIC_SITE_URL
      ? {
          alternates: {
            canonical: new URL(canonicalPath, PUBLIC_SITE_URL).toString(),
          },
        }
      : {}),
    ...(isFiltered ? { robots: { index: false, follow: true } } : {}),
  };
}

function ShopFilterBar({
  category,
  collection,
  search,
  minPrice,
  maxPrice,
  attrs,
  categories,
}: {
  category?: string;
  collection?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  attrs?: string;
  categories?: string;
}) {
  return <DynamicFilterBar facetParams={{
    category,
    collection,
    search,
    minPrice,
    maxPrice,
    attributes: parseAttributesParam(attrs),
    categories: parseCategoriesParam(categories),
  }} />;
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
  const collection = typeof sp.collection === "string" ? sp.collection.trim() || undefined : undefined;

  const routeCategoryPath = slug?.length ? slug.join("/") : undefined;

  const categoryDetails = routeCategoryPath
    ? await loadCategory(routeCategoryPath)
    : null;
  if (routeCategoryPath && !categoryDetails) notFound();

  const children = categoryDetails?.children ?? [];
  const hasChildren = children.length > 0;

  const directProductsCount = categoryDetails?.productsCount ?? 0;

  const hasProducts = directProductsCount > 0 || !categoryDetails;

  const isPureCategoryHub = !collection && !hasProducts && hasChildren;

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
    <div className="relative min-w-0">
      {isPureCategoryHub ? (
        <Suspense fallback={<SubcategoriesSkeleton />}>
          <Subcategories subCategories={children} parent_category={parent_category} />
        </Suspense>
      ) : (
        <>
          <ShopFilterBar
            category={routeCategoryPath || sp.category}
            collection={collection}
            search={sp.search}
            minPrice={minPrice}
            maxPrice={maxPrice}
            attrs={sp.attrs}
            categories={sp.categories}
          />

          <Suspense
            fallback={
              <div className="container storefront-page-start">
                {sp.search ? <div className="mb-5 h-12 sm:mb-6" aria-hidden="true" /> : null}
                <ProductsSkeleton contained={false} className="gap-3 sm:gap-5 lg:gap-7" />
              </div>
            }
          >
            <ShopContent slug={slug} categoryDetails={categoryDetails} sp={sp} sort={sort} minPrice={minPrice} maxPrice={maxPrice} collection={collection} />
          </Suspense>
        </>
      )}

      <Features />
    </div>
  );
}

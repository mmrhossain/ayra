import {
  fetchProducts,
  parseAttributesParam,
  parseCategoriesParam,
  type ProductSort,
} from "@/features/catalog/api";
import ProductGrid from "@/features/catalog/components/product/ProductGrid";
import EmptyState from "@/components/shared/EmptyState";
import CursorProductList from "@/features/catalog/components/shop/CursorProductList";
import Pagination from "@/features/catalog/components/shop/Pagination";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/store-front";
import type { CategoryListItem } from "@/features/catalog/types";

const SHOP_PAGE_SIZE = 12;

interface ShopContentProps {
  slug?: string[];
  categoryDetails: CategoryListItem | null;
  collection?: string;
  sp: {
    page?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    attrs?: string;
    categories?: string;
  };
  sort: ProductSort;
  minPrice?: number;
  maxPrice?: number;
}

export default async function ShopContent({
  slug,
  categoryDetails,
  sp,
  sort,
  minPrice,
  maxPrice,
  collection,
}: ShopContentProps) {
  const page =
    sp.page === undefined ? undefined : Math.max(1, Number(sp.page) || 1);
  const search = sp.search || undefined;

  const routeCategoryPath = slug?.length ? slug.join("/") : undefined;
  const categorySlug = routeCategoryPath || sp.category || undefined;

  const attributes = parseAttributesParam(sp.attrs);
  const selectedCategories = parseCategoriesParam(sp.categories);

  const productResult = await fetchProducts({
      ...(page === undefined ? {} : { page }),
      limit: SHOP_PAGE_SIZE,
      category: categorySlug,
      collection,
      search,
      sort,
      minPrice,
      maxPrice,
      attributes,
      categories: selectedCategories,
    }).catch(error => {
      if (collection && error instanceof ApiError && error.status === 404) notFound();
      throw error;
    });

  const items = productResult?.items ?? [];
  const pagination = productResult?.pagination;

  const hasProducts = items.length > 0;

  const basePath = slug?.length ? `/shop/${slug.join("/")}` : "/shop";

  const filters = {
    collection,
    category: categorySlug,
    sort: sort === "newest" ? undefined : sort,
    minPrice: minPrice != null ? String(minPrice) : undefined,
    maxPrice: maxPrice != null ? String(maxPrice) : undefined,
    search,
    attrs: sp.attrs,
    categories: sp.categories,
  };

  return (
    <div className="container storefront-page-start min-h-[calc(100svh-var(--header-height,112px))]">
      {search ? (
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight lg:text-3xl">
            Search Results for: <span className="italic">{search}</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Found {pagination?.total ?? items.length} items
          </p>
        </div>
      ) : (
        <>
          <h1 className="sr-only">
            {categoryDetails?.name ? `${categoryDetails.name} products` : "Shop products"}
          </h1>
          {categoryDetails?.description ? (
            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:mb-6">
              {categoryDetails.description}
            </p>
          ) : null}
        </>
      )}

      {hasProducts ? (
        <div>
          {page === undefined ? (
            <CursorProductList
              key={JSON.stringify(filters)}
              initialItems={items}
              initialCursor={productResult.nextCursor ?? null}
              query={{
                limit: SHOP_PAGE_SIZE,
                category: categorySlug,
                collection,
                search,
                sort,
                minPrice,
                maxPrice,
                attributes,
                categories: selectedCategories,
              }}
            />
          ) : (
            <ProductGrid items={items} eagerAboveFold />
          )}
        </div>
      ) : (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or filters, or browse all available products."
          actionLabel="Browse all products"
          actionHref="/shop"
        />
      )}

      {pagination && hasProducts && page !== undefined ? (
        <Pagination pagination={pagination} filters={filters} basePath={basePath} />
      ) : null}
    </div>
  );
}

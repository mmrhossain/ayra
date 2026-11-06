import {
  fetchProducts,
  getCategoryBySlug,
  parseAttributesParam,
  parseCategoriesParam,
  type ProductSort,
} from "@/features/catalog/api";
import ProductCard from "@/features/catalog/components/product/ProductCard";
import ProductNotFound from "@/features/catalog/components/product/ProductNotFound";
import Pagination from "@/features/catalog/components/shop/Pagination";
import { notFound } from "next/navigation";

interface ShopContentProps {
  slug?: string[];
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
  sp,
  sort,
  minPrice,
  maxPrice,
}: ShopContentProps) {
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search || undefined;

  const routeCategoryPath = slug?.length ? slug.join("/") : undefined;
  const categorySlug = routeCategoryPath || sp.category || undefined;

  const attributes = parseAttributesParam(sp.attrs);
  const selectedCategories = parseCategoriesParam(sp.categories);

  const categoryDetailsPromise = routeCategoryPath
    ? getCategoryBySlug(routeCategoryPath)
    : Promise.resolve(null);

  const [productResult, categoryDetails] = await Promise.all([
    fetchProducts({
      page,
      limit: 20,
      category: categorySlug,
      search,
      sort,
      minPrice,
      maxPrice,
      attributes,
      categories: selectedCategories,
    }),
    categoryDetailsPromise,
  ]);

  if (routeCategoryPath && !categoryDetails) {
    return notFound();
  }

  const items = productResult?.items ?? [];
  const pagination = productResult?.pagination;

  const hasProducts = items.length > 0;

  const basePath = slug?.length ? `/shop/${slug.join("/")}` : "/shop";

  const filters = {
    category: categorySlug,
    sort: sort === "newest" ? undefined : sort,
    minPrice: minPrice != null ? String(minPrice) : undefined,
    maxPrice: maxPrice != null ? String(maxPrice) : undefined,
    search,
    attrs: sp.attrs,
    categories: sp.categories,
  };

  return (
    <div className="container mt-8">
      {search ? (
        <div className="mb-6">
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
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-zinc-500">
              {categoryDetails.description}
            </p>
          ) : null}
        </>
      )}

      {hasProducts ? (
        <div className="mt-6 md:mt-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-7 xl:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ProductNotFound />
        </div>
      )}

      {pagination && hasProducts ? (
        <Pagination pagination={pagination} filters={filters} basePath={basePath} />
      ) : null}
    </div>
  );
}

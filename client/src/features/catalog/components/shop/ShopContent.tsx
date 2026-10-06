import { fetchProducts, type ProductSort } from "@/features/catalog/api";
import { getCategoryBySlug } from "@/features/catalog/categories-api";
import Subcategories from "@/features/catalog/components/category/Subcategories";
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

  const routeCategorySlug = slug?.length ? slug[slug.length - 1] : undefined;
  const categorySlug = routeCategorySlug || sp.category || undefined;

  const categoryDetailsPromise = routeCategorySlug
    ? getCategoryBySlug(routeCategorySlug).catch(() => null)
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
    }),
    categoryDetailsPromise,
  ]);

  if (routeCategorySlug && !categoryDetails) {
    return notFound();
  }

  const items = productResult?.items ?? [];
  const pagination = productResult?.pagination;
  const subcategories = categoryDetails?.children ?? [];

  const hasProducts = items.length > 0;
  const hasSubcategories = subcategories.length > 0;

  const basePath = slug?.length ? `/shop/${slug.join("/")}` : "/shop";

  const filters = {
    category: categorySlug,
    sort: sort === "newest" ? undefined : sort,
    minPrice: minPrice != null ? String(minPrice) : undefined,
    maxPrice: maxPrice != null ? String(maxPrice) : undefined,
    search,
  };

  return (
    <>
      {categoryDetails && !search && hasSubcategories ? (
        <Subcategories
          subCategories={subcategories}
          parent_category={{
            name: categoryDetails.name,
            image: categoryDetails.image,
            mobileImage: categoryDetails.mobileImage,
          }}
        />
      ) : null}

      <div className="container mt-8">
        {search ? (
          <div className="mb-6">
            <h1 className="text-xl font-bold">
              Search Results for: <span className="italic">{search}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Found {pagination?.total ?? items.length} items
            </p>
          </div>
        ) : categoryDetails?.description ? (
          <p className="max-w-2xl text-sm text-zinc-500 mb-6">{categoryDetails.description}</p>
        ) : null}

        {hasProducts ? (
          <div className="mt-6 md:mt-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-7 xl:grid-cols-4">
              {items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : !hasSubcategories || search ? (
          <div className="mt-8">
            <ProductNotFound />
          </div>
        ) : null}

        {pagination && hasProducts ? (
          <Pagination pagination={pagination} filters={filters} basePath={basePath} />
        ) : null}
      </div>
    </>
  );
}

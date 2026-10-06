import { fetchProducts } from "@/features/catalog/api";
import ProductCard from "@/features/catalog/components/product/ProductCard";
import ProductNotFound from "@/features/catalog/components/product/ProductNotFound";
import ShopPagination from "@/features/catalog/components/shop/Pagination";

export const dynamic = "force-dynamic";

type SearchParams = {
  result?: string;
  page?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const slug = (sp.result ?? "").trim();

  if (!slug) return <ProductNotFound slug="" />;

  const page = Math.max(1, Number(sp.page) || 1);
  const keyword = slug.replace(/-/g, " ");

  const productResult = await fetchProducts({
    page,
    limit: 20,
    search: keyword,
  });

  const items = productResult?.items ?? [];
  const pagination = productResult?.pagination;

  return (
    <div className="min-h-[80vh] 2xl:min-h-[100vh] container">
      <div className="py-4">
        <h1 className="font-medium capitalize">
          Search results for: <span className="font-semibold text-primary">{keyword}</span>
        </h1>

        {items.length === 0 ? (
          <ProductNotFound slug={keyword} />
        ) : (
          <div className="mt-6 md:mt-8">
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 md:mt-5 lg:grid-cols-4 lg:gap-7 xl:grid-cols-4">
              {items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
        {pagination ? (
          <ShopPagination pagination={pagination} filters={{ result: slug }} basePath="/search" />
        ) : null}
      </div>
    </div>
  );
}

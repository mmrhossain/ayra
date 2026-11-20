"use client";


import ProductGrid from "@/features/catalog/components/product/ProductGrid";
import { useInfiniteProductList } from "@/features/catalog/hooks/use-infinite-product-list";
import {
  fetchProductList,
  type ProductListItem,
  type ProductListParams,
} from "@/features/catalog/api";

export default function CursorProductList({
  initialItems,
  initialCursor,
  query,
}: {
  initialItems: ProductListItem[];
  initialCursor: string | null;
  query: ProductListParams;
}) {
  const loadPage = (cursor: string) => fetchProductList({ ...query, cursor });
  const { items, cursor, loading, error, sentinelRef, loadMore } = useInfiniteProductList({
    initialItems,
    initialCursor,
    loadPage,
  });

  return (
    <>
      <ProductGrid items={items} eagerAboveFold />
      {cursor ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          {loading ? (
            <div role="status" aria-label="Loading more products" className="flex w-full justify-center py-5">
              <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground motion-reduce:animate-none" />
            </div>
          ) : null}
          {error ? (
            <div className="flex flex-col items-center gap-2">
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
              <button
                type="button"
                onClick={loadMore}
                className="text-sm font-medium underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
        </div>
      ) : null}
    </>
  );
}

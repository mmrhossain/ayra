"use client";

import { useCallback } from "react";
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
  const loadPage = useCallback(
    (cursor: string) => fetchProductList({ ...query, cursor }),
    [query]
  );
  const { items, cursor, loading, error, sentinelRef, loadMore } = useInfiniteProductList({
    initialItems,
    initialCursor,
    loadPage,
  });

  return (
    <>
      <ProductGrid items={items} eagerFirstImage />
      {cursor ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          {loading ? (
            <p role="status" aria-live="polite" className="text-sm text-zinc-500">
              Loading more products...
            </p>
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

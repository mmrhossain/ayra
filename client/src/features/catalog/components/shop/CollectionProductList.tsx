"use client";

import { useCallback } from "react";
import ProductGrid from "@/features/catalog/components/product/ProductGrid";
import { fetchCollectionProducts, type CollectionPage } from "@/features/catalog/collections";
import { useInfiniteProductList } from "@/features/catalog/hooks/use-infinite-product-list";
export default function CollectionProductList({
  initial
}: {
  initial: CollectionPage;
}) {
  const loadPage = useCallback((cursor: string) => fetchCollectionProducts(initial.collection.slug, cursor), [initial.collection.slug]);
  const {
    items,
    cursor,
    loading,
    error,
    sentinelRef,
    loadMore
  } = useInfiniteProductList({
    initialItems: initial.items,
    initialCursor: initial.nextCursor,
    loadPage
  });
  return <>
    {items.length ? <ProductGrid items={items} eagerAboveFold /> : <p className="py-12 text-center text-muted-foreground">No products are available in this collection yet.</p>}
    {cursor ? <div className="mt-8 flex flex-col items-center gap-3">
      {loading ? <div role="status" aria-label="Loading more products" className="flex w-full justify-center py-5"><span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground motion-reduce:animate-none" /></div> : null}
      {error ? <div className="space-y-2 text-center"><p role="alert" className="text-sm text-destructive">{error}</p><button type="button" className="text-sm underline" onClick={loadMore}>Try again</button></div> : null}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
    </div> : null}
  </>;
}

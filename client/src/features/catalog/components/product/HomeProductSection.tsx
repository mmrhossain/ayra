"use client";

import { useCallback } from "react";
import CustomButton from "@/components/shared/CustomButton";
import FancyHeading from "@/components/shared/FancyHeading";
import ProductGrid from "@/features/catalog/components/product/ProductGrid";
import { ArrowRight } from "lucide-react";
import type { ProductListItem } from "../../api";
import { fetchHomeSectionProducts } from "@/features/home/api";
import { useInfiniteProductList } from "@/features/catalog/hooks/use-infinite-product-list";

export default function HomeProductSection({
  sectionId,
  title,
  products,
  initialCursor,
  seeMorePath,
  seeMoreText,
}: {
  sectionId: string;
  title: string;
  products: ProductListItem[];
  initialCursor: string | null;
  seeMorePath: string;
  seeMoreText: string;
}) {
  const loadPage = useCallback(
    (cursor: string) => fetchHomeSectionProducts(sectionId, cursor),
    [sectionId]
  );
  const { items, cursor, loading, error, sentinelRef, loadMore } = useInfiniteProductList({
    initialItems: products,
    initialCursor,
    loadPage,
    enabled: products.length > 0,
  });

  if (!products.length) return null;

  return (
    <section className="container my-8 md:my-12">
      {/* Top Header: Title on Left, See All Button on Right */}
      <div className="flex flex-row items-center justify-between mb-6 md:mb-8">
        <FancyHeading text={title} />

        {seeMorePath && seeMoreText && (
          <CustomButton
            ctaText={seeMoreText}
            path={seeMorePath}
            icon={
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            }
            className="h-auto gap-1 bg-transparent p-0 text-sm font-medium tracking-wide text-slate-900 uppercase shadow-none hover:bg-transparent hover:text-primary"
          />
        )}
      </div>

      {/* Products Grid */}
      <ProductGrid items={items} className="gap-4 sm:gap-6 lg:gap-7" />
      {cursor ? (
        <div className="mt-6 flex flex-col items-center gap-3">
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
    </section>
  );
}

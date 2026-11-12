"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  parseAttributesParam,
  parseCategoriesParam,
  serializeAttributesParam,
  type ProductFacets,
} from "@/features/catalog/api";
import type { PriceBucket } from "@/features/catalog/types";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import FilterPanel from "./FilterPanel";

interface DynamicFilterBarProps {
  facets?: ProductFacets | null;
}

const SORT_LABEL: Record<string, string> = {
  newest: "Newest",
  price_desc: "Price: High to Low",
  price_asc: "Price: Low to High",
};

export default function DynamicFilterBar({ facets }: DynamicFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  const currentSort = searchParams.get("sort") || "newest";

  const selectedAttributes = useMemo(
    () => parseAttributesParam(searchParams.get("attrs")),
    [searchParams]
  );

  const selectedCategories = useMemo(
    () => parseCategoriesParam(searchParams.get("categories")),
    [searchParams]
  );

  const priceBuckets = useMemo(() => facets?.price.buckets ?? [], [facets]);

  const selectedBucket = useMemo<PriceBucket | null>(() => {
    const rawMax = searchParams.get("maxPrice");
    if (rawMax === null) return null;
    const min = Number(searchParams.get("minPrice"));
    const max = Number(rawMax);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return priceBuckets.find((bucket) => bucket.from === min && bucket.to === max) ?? null;
  }, [searchParams, priceBuckets]);

  const [draftCategories, setDraftCategories] = useState(selectedCategories);
  const [draftAttributes, setDraftAttributes] = useState(selectedAttributes);
  const [draftBucket, setDraftBucket] = useState<PriceBucket | null>(selectedBucket);

  const searchParamsRef = useRef(searchParams);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingParamsRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) return;
    setDraftCategories(selectedCategories);
    setDraftAttributes(selectedAttributes);
    setDraftBucket(selectedBucket);
  }, [selectedAttributes, selectedBucket, selectedCategories]);

  const pushParams = useCallback(
    (newParams: Record<string, string | null>, debounceMs = 0) => {
      const apply = (patch: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParamsRef.current.toString());
        Object.entries(patch).forEach(([key, value]) => {
          if (value === null || value === "") {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        });
        params.set("page", "1");
        pendingParamsRef.current = {};
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      };

      if (debounceMs <= 0) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        const patch = { ...pendingParamsRef.current, ...newParams };
        apply(patch);
        return;
      }

      pendingParamsRef.current = { ...pendingParamsRef.current, ...newParams };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        apply(pendingParamsRef.current);
      }, debounceMs);
    },
    [pathname, router]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleToggleCategory = (slug: string) => {
    const next = draftCategories.includes(slug)
      ? draftCategories.filter((item) => item !== slug)
      : [...draftCategories, slug];
    setDraftCategories(next);
    pushParams({ categories: next.length > 0 ? next.join(",") : null }, 400);
  };

  const handleAttributeChange = (attributeId: string, valueIds: string[]) => {
    const next = { ...draftAttributes };
    if (valueIds.length > 0) next[attributeId] = valueIds;
    else delete next[attributeId];
    setDraftAttributes(next);
    pushParams({ attrs: serializeAttributesParam(next) ?? null }, 400);
  };

  const handleSelectBucket = (bucket: PriceBucket | null) => {
    setDraftBucket(bucket);
    if (!bucket) {
      pushParams({ minPrice: null, maxPrice: null }, 400);
      return;
    }
    pushParams(
      {
        minPrice: String(bucket.from),
        maxPrice: String(bucket.to),
      },
      400
    );
  };

  const handleClearAll = () => {
    setDraftCategories([]);
    setDraftAttributes({});
    setDraftBucket(null);
    pushParams({
      categories: null,
      attrs: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    pushParams({
      sort: e.target.value === "newest" ? null : e.target.value,
    });
  };

  const activeCount =
    draftCategories.length +
    Object.values(draftAttributes).filter((values) => values.length > 0).length +
    (draftBucket ? 1 : 0);

  return (
    <>
      <div className="sticky top-[var(--navbar-height,68px)] z-40 border-b border-zinc-100 bg-white/90 backdrop-blur-xl">
        <div className="container flex h-14 min-w-0 items-center justify-between gap-3 sm:h-16">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
            className="group flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-zinc-900 px-3 py-2.5 text-white shadow-lg shadow-zinc-200 transition-all hover:bg-black active:scale-95 sm:gap-3 sm:px-4 lg:px-5"
          >
            <SlidersHorizontal
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
            <span className="text-xs font-semibold tracking-wide uppercase hidden md:block">
              Filters
            </span>
            {activeCount > 0 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
                {activeCount}
              </span>
            ) : null}
          </button>

          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <div className="hidden items-center gap-2 text-zinc-400 md:flex">
              <span className="text-xs font-bold uppercase tracking-widest">Sort By:</span>
            </div>
            <div className="group relative cursor-pointer">
              <div className="flex items-center gap-1 border-b-2 border-zinc-900 pb-0.5">
                <span className="max-w-[8rem] truncate text-xs font-semibold tracking-tight uppercase xs:max-w-[9.5rem] sm:max-w-none">
                  {SORT_LABEL[currentSort] ?? "Newest"}
                </span>
                <ChevronDown
                  size={14}
                  className="transition-transform group-hover:translate-y-0.5"
                />
              </div>
              <select
                value={currentSort}
                onChange={handleSortChange}
                aria-label="Sort products"
                className="absolute inset-0 h-full min-h-11 w-full cursor-pointer opacity-0"
              >
                <option value="newest">Newest</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
        <DrawerContent className="ml-auto flex h-dvh max-h-dvh w-[min(100%,24rem)] flex-col rounded-none border-l border-zinc-100 bg-white shadow-2xl md:max-w-md">
          <DrawerHeader className="shrink-0 border-b px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle className="text-xl font-semibold italic tracking-tight uppercase sm:text-2xl">
                Filters
              </DrawerTitle>
              <DrawerClose
                aria-label="Close filters"
                className="rounded-full p-3 transition-all hover:bg-zinc-100"
              >
                <X size={20} />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
            <FilterPanel
              categories={facets?.categories}
              selectedCategories={draftCategories}
              onToggleCategory={handleToggleCategory}
              attributes={facets?.attributes}
              selectedAttributes={draftAttributes}
              onAttributeChange={handleAttributeChange}
              priceBuckets={priceBuckets}
              selectedBucket={draftBucket}
              onSelectBucket={handleSelectBucket}
              onClearAll={handleClearAll}
            />
          </div>

          <div className="shrink-0 border-t bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-8">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-black"
            >
              View results
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

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
import React, { Suspense, startTransition, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import FilterPanel from "./FilterPanel";

interface DynamicFilterBarProps {
  facets: Promise<ProductFacets | null>;
}

function ShopFilterOptions({
  facets,
  ...props
}: DynamicFilterBarProps & Omit<React.ComponentProps<typeof FilterPanel>, "categories" | "attributes" | "priceBuckets">) {
  const data = use(facets);
  return (
    <>
      {!data && <p role="status" className="mb-3 text-sm text-muted-foreground">Filter options couldn’t load.</p>}
      <FilterPanel {...props} categories={data?.categories} attributes={data?.attributes} priceBuckets={data?.price.buckets ?? []} />
    </>
  );
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

  const selectedBucket = useMemo<PriceBucket | null>(() => {
    const rawMax = searchParams.get("maxPrice");
    if (rawMax === null) return null;
    const min = Number(searchParams.get("minPrice"));
    const max = Number(rawMax);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { from: min, to: max };
  }, [searchParams]);

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
    (newParams: Record<string, string | null>, debounceMs = 0, scroll = true) => {
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
          router.push(`${pathname}?${params.toString()}`, { scroll });
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

  const handleSortChange = (sort: string) => {
    pushParams({
      sort: sort === "newest" ? null : sort,
    }, 0, false);
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
            className="group flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-900 transition-all hover:bg-zinc-200 active:scale-95 sm:gap-3 sm:py-2.5 lg:px-5"
          >
            <SlidersHorizontal
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
            <span className="text-xs font-semibold tracking-wide uppercase hidden md:block">
              Filters
            </span>
            {activeCount > 0 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-900">
                {activeCount}
              </span>
            ) : null}
          </button>

          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <div className="hidden items-center gap-2 text-zinc-400 md:flex">
              <span className="text-xs font-bold uppercase tracking-widest">Sort By:</span>
            </div>
            <details
              className="group relative min-w-0"
              onBlur={event => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
                  event.currentTarget.open = false;
                }
              }}
              onKeyDown={event => {
                if (event.key !== "Escape" || !event.currentTarget.open) return;
                event.stopPropagation();
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Sort products</span>
                <span className="max-w-[8rem] truncate text-xs font-semibold tracking-tight uppercase xs:max-w-[9.5rem] sm:max-w-none">
                  {SORT_LABEL[currentSort] ?? "Newest"}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  size={14}
                  className="shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="absolute right-0 top-full z-10 min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-md">
                {Object.entries(SORT_LABEL).map(([sort, label]) => (
                  <li key={sort}>
                    <button
                      type="button"
                      aria-pressed={currentSort === sort}
                      onClick={() => handleSortChange(sort)}
                      className="min-h-11 w-full whitespace-nowrap rounded px-3 text-left text-sm hover:bg-zinc-100 aria-pressed:bg-zinc-100 aria-pressed:font-semibold"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
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
            <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Loading filter options…</p>}>
              <ShopFilterOptions
                facets={facets}
                selectedCategories={draftCategories}
                onToggleCategory={handleToggleCategory}
                selectedAttributes={draftAttributes}
                onAttributeChange={handleAttributeChange}
                selectedBucket={draftBucket}
                onSelectBucket={handleSelectBucket}
                onClearAll={handleClearAll}
              />
            </Suspense>
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

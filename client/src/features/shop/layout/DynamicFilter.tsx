"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { CategoryItem } from "@/features/shop/types";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import FilterPanel from "./FilterPanel";

interface DynamicFilterBarProps {
  categories: CategoryItem[];
}

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 10000;

const RESERVED_PARAMS = new Set(["category", "sort", "minPrice", "maxPrice", "page"]);

// Helper: Recursively search for category object by slug or id
function findCategoryBySlug(categories: CategoryItem[], slug: string): CategoryItem | null {
  for (const cat of categories) {
    if (cat.slug === slug || cat.id === slug) return cat;
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryBySlug(cat.children, slug);
      if (found) return found;
    }
  }
  return null;
}

export default function DynamicFilterBar({ categories }: DynamicFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  // 1. Core Params
  const currentCategorySlug = useMemo(() => searchParams.get("category") || "all", [searchParams]);

  const currentSort = useMemo(() => searchParams.get("sort") || "newest", [searchParams]);

  const selectedPrice = useMemo(
    () => ({
      min: Number(searchParams.get("minPrice")) || DEFAULT_MIN_PRICE,
      max: Number(searchParams.get("maxPrice")) || DEFAULT_MAX_PRICE,
    }),
    [searchParams]
  );

  // 2. Locate Active Category in Hierarchy
  const activeCategory = useMemo(() => {
    if (currentCategorySlug === "all") return null;
    return findCategoryBySlug(categories, currentCategorySlug);
  }, [categories, currentCategorySlug]);

  // 3. Contextual Subcategories
  // If active category has children, show children. If top-level, show top-level categories.
  const displayCategories = useMemo(() => {
    if (!activeCategory) {
      // Direct /shop route: show top-level categories
      return categories;
    }
    if (activeCategory.children && activeCategory.children.length > 0) {
      // Parent category (e.g. Saree): show child categories (e.g. Jamdani, Silk)
      return activeCategory.children;
    }
    // Leaf category: show siblings or self
    return [activeCategory];
  }, [categories, activeCategory]);

  // 4. Contextual Attributes
  // Extract attributes specific to active category (fall back to all if on global shop)
  const availableAttributes = useMemo(() => {
    if (activeCategory?.attributes) {
      return activeCategory.attributes;
    }
    // Merge or fallback to top-level attributes
    return [];
  }, [activeCategory]);

  // 5. Dynamic Attributes from URL
  const selectedAttributes = useMemo(() => {
    const attributes: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (!RESERVED_PARAMS.has(key) && value) {
        attributes[key] = value.split(",");
      }
    });
    return attributes;
  }, [searchParams]);

  // 6. Active Filter Count
  const activeCount = useMemo(() => {
    let count = 0;
    if (currentCategorySlug !== "all") count += 1;
    if (selectedPrice.min > DEFAULT_MIN_PRICE || selectedPrice.max < DEFAULT_MAX_PRICE) {
      count += 1;
    }
    Object.values(selectedAttributes).forEach((vals) => {
      if (vals.length > 0) count += 1;
    });
    return count;
  }, [currentCategorySlug, selectedPrice, selectedAttributes]);

  // 7. URL Update Handler
  const updateQueryParams = useCallback(
    (newParams: Record<string, string | number | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          value === undefined ||
          value === "all" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      });

      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleSelectCategory = (catSlug: string) => {
    // Reset dynamic attributes when changing category context
    const resetAttributes: Record<string, null> = {};
    Object.keys(selectedAttributes).forEach((key) => {
      resetAttributes[key] = null;
    });

    updateQueryParams({
      category: catSlug,
      ...resetAttributes,
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    updateQueryParams({
      minPrice: min > DEFAULT_MIN_PRICE ? min : null,
      maxPrice: max < DEFAULT_MAX_PRICE ? max : null,
    });
  };

  const handleAttributeChange = (attributeKey: string, values: string[]) => {
    updateQueryParams({
      [attributeKey]: values.length > 0 ? values : null,
    });
  };

  const handleClearAll = () => {
    const paramsToClear: Record<string, null> = {
      category: null,
      minPrice: null,
      maxPrice: null,
    };
    Object.keys(selectedAttributes).forEach((key) => {
      paramsToClear[key] = null;
    });
    updateQueryParams(paramsToClear);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQueryParams({
      sort: e.target.value === "newest" ? null : e.target.value,
    });
  };

  return (
    <>
      {/* Filter Bar Bar */}
      <div className="sticky top-[var(--header-height,68px)] z-40 border-b border-zinc-100 bg-white/90 backdrop-blur-xl">
        <div className="container flex h-14 min-w-0 items-center justify-between gap-3 sm:h-16">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-3 py-2.5 text-white shadow-lg shadow-zinc-200 transition-all hover:bg-black active:scale-95 sm:gap-3 sm:px-4 lg:px-6"
          >
            <SlidersHorizontal
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Filters</span>
            {activeCount > 0 && (
              <span className="animate-in zoom-in flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-black">
                {activeCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <div className="hidden items-center gap-2 text-zinc-400 md:flex">
              <span className="text-[10px] font-bold uppercase tracking-widest">Sort By:</span>
            </div>
            <div className="group relative cursor-pointer">
              <div className="flex items-center gap-1 border-b-2 border-zinc-900 pb-0.5">
                <span className="max-w-[9.5rem] truncate text-xs font-black uppercase tracking-tight sm:max-w-none">
                  {currentSort === "price_asc"
                    ? "Price: Low to High"
                    : currentSort === "price_desc"
                      ? "Price: High to Low"
                      : currentSort === "popular"
                        ? "Popular"
                        : "Newest"}
                </span>
                <ChevronDown
                  size={14}
                  className="transition-transform group-hover:translate-y-0.5"
                />
              </div>
              <select
                value={currentSort}
                onChange={handleSortChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Popular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
        <DrawerContent className="ml-auto h-dvh max-h-dvh w-[min(100%,24rem)] rounded-none border-l border-zinc-100 bg-white shadow-2xl md:max-w-md">
          <DrawerHeader className="border-b px-8 py-6">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-2xl font-black italic uppercase tracking-tighter">
                Filters
              </DrawerTitle>
              <DrawerClose className="rounded-full p-3 transition-all hover:bg-zinc-100">
                <X size={20} />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-8 py-6">
            <FilterPanel
              // Scoped categories (Child categories if parent selected)
              categoryObjects={displayCategories}
              selectedCategory={currentCategorySlug}
              onSelectCategory={handleSelectCategory}
              // Scoped attributes for active category
              availableAttributes={availableAttributes}
              selectedAttributes={selectedAttributes}
              onAttributeChange={handleAttributeChange}
              // Price
              priceMin={DEFAULT_MIN_PRICE}
              priceMax={DEFAULT_MAX_PRICE}
              selectedPrice={selectedPrice}
              onPriceChange={handlePriceChange}
              onClearAll={handleClearAll}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

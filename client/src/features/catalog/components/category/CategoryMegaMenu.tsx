"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryListItem } from "../../types";

interface CategoryMegaMenuProps {
  categories: CategoryListItem[];
  onSelect: (name: string) => void;
}

function findCategoryPath(
  categories: CategoryListItem[],
  targetId: string,
  parents: CategoryListItem[] = []
): CategoryListItem[] | null {
  for (const category of categories) {
    const currentPath = [...parents, category];

    if (category.id === targetId) {
      return currentPath;
    }

    if (category.children?.length) {
      const result = findCategoryPath(category.children, targetId, currentPath);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

function categoryHref(categories: CategoryListItem[], category: CategoryListItem) {
  const path = findCategoryPath(categories, category.id);

  if (!path?.length) {
    return `/shop/${category.slug}`;
  }

  return `/shop/${path.map((item) => item.slug).join("/")}`;
}

export default function CategoryMegaMenu({ categories, onSelect }: CategoryMegaMenuProps) {
  const [activeId, setActiveId] = useState<string | null>(categories[0]?.id ?? null);

  const { active, children } = useMemo(() => {
    const foundActive = categories.find((category) => category.id === activeId) ?? categories[0];

    return {
      active: foundActive,
      children: foundActive?.children ?? [],
    };
  }, [categories, activeId]);

  return (
    <div className="absolute top-full left-0 z-40 pt-2 opacity-0 invisible translate-y-1 transition-all duration-200 ease-out group-hover/cat:opacity-100 group-hover/cat:visible group-hover/cat:translate-y-0">
      <div className="flex min-h-[300px] w-[620px] overflow-hidden rounded-md border border-slate-100 bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.18)]">
        {/* Left Categories Column with Scrollbar */}
        <div className="w-[230px] shrink-0 border-r border-slate-100 bg-slate-50/80 py-3 max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Collections
          </p>

          <Link
            href="/shop"
            onClick={() => onSelect("All Categories")}
            className="mx-2 mb-1 flex items-center rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-white"
          >
            All Categories
          </Link>

          {categories.map((cat) => {
            const isActive = cat.id === active?.id;

            return (
              <Link
                key={cat.id}
                href={categoryHref(categories, cat)}
                onMouseEnter={() => setActiveId(cat.id)}
                onFocus={() => setActiveId(cat.id)}
                onClick={() => onSelect(cat.name)}
                className={`mx-2 flex items-center justify-between rounded-sm px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-primary shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{cat.name}</span>

                {(cat.children?.length ?? 0) > 0 && (
                  <ChevronRight
                    size={14}
                    className={isActive ? "text-primary shrink-0" : "text-slate-300 shrink-0"}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Subcategories / Details Column with Scrollbar */}
        <div className="flex min-w-0 flex-1 flex-col p-6 max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {active ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Shop
                  </p>

                  <h3 className="mt-0.5 text-base font-bold tracking-tight text-slate-900 truncate">
                    {active.name}
                  </h3>
                </div>

                <Link
                  href={categoryHref(categories, active)}
                  onClick={() => onSelect(active.name)}
                  className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline shrink-0"
                >
                  View all
                </Link>
              </div>

              {children.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={categoryHref(categories, child)}
                      onClick={() => onSelect(child.name)}
                      className="rounded-sm px-3 py-2 text-[13px] font-medium text-slate-600 transition-all duration-200 hover:bg-primary/5 hover:text-primary truncate"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Browse this collection.</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

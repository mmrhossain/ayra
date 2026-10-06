"use client";

import { RichTextContent } from "@/components/shared/rich-text-content";
import type { ProductDetail } from "@/features/catalog/api";
import ReviewTab from "@/features/reviews/components/ReviewTab";
import { formatPrice } from "@/helpers";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TABS = [
  { id: "description", label: "Description" },
  { id: "specifications", label: "Specifications" },
  { id: "reviews", label: "Rating & Reviews" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ProductTabs = ({ product }: { product: ProductDetail }) => {
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const defaultVariant =
    product.variants?.find((v) => v.isDefault) ?? product.variants?.[0];
  const price = Number(defaultVariant?.price ?? 0);

  const specRows = [
    { label: "Product Name", value: product.name },
    { label: "Price", value: price ? formatPrice(price) : "—" },
    { label: "SKU", value: defaultVariant?.sku || product.sku || "—" },
    { label: "Category", value: product.category?.name || "—" },
    { label: "Brand", value: product.brand?.name || "Raangalay" },
  ];

  return (
    <div className="container mx-auto mt-8 mb-10 max-w-6xl sm:mt-10 md:mt-14 md:mb-14 xl:max-w-7xl">
      <div className="relative flex items-stretch border-b border-border-color">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 cursor-pointer px-1 pb-3 text-center text-xs font-medium transition-colors sm:pb-4 sm:text-sm md:text-base lg:text-lg",
                isActive
                  ? "text-secondary after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full after:bg-secondary"
                  : "text-sky-color hover:text-secondary",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 md:mt-10">
        {activeTab === "description" && (
          <div className="space-y-6 animate-in fade-in duration-300 sm:space-y-8">
            <div>
              <h2 className="mb-3 text-base font-bold text-secondary sm:text-lg md:text-xl">
                Description
              </h2>
              <RichTextContent
                html={product.description}
                fallback="Product description will appear here."
                className="max-w-4xl text-sm leading-relaxed text-sky-color sm:text-[15px] md:text-base"
              />
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="space-y-6 animate-in fade-in duration-300 sm:space-y-8">
            <div>
              <h2 className="mb-3 text-base font-bold text-secondary sm:text-lg md:text-xl">
                Specifications
              </h2>
              <div className="overflow-hidden rounded-xl border border-border-color sm:rounded-2xl">
                {specRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={cn(
                      "grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-2 sm:px-6 sm:py-4",
                      index !== specRows.length - 1 &&
                        "border-b border-border-color",
                    )}
                  >
                    <span className="text-sm font-semibold text-secondary">
                      {row.label}
                    </span>
                    <span className="text-sm text-sky-color">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="animate-in fade-in duration-300">
            <ReviewTab
              productId={product.id}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;

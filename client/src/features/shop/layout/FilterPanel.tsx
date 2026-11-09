"use client";

import type { FacetAttribute, FacetCategory, PriceBucket } from "@/features/catalog/types";
import { formatPrice } from "@/lib/format";
import { RotateCcw } from "lucide-react";

type FilterPanelProps = {
  categories?: FacetCategory[];
  selectedCategories: string[];
  onToggleCategory: (slug: string) => void;
  attributes?: FacetAttribute[];
  selectedAttributes: Record<string, string[]>;
  onAttributeChange: (attributeId: string, valueIds: string[]) => void;
  priceBuckets: PriceBucket[];
  selectedBucket: PriceBucket | null;
  onSelectBucket: (bucket: PriceBucket) => void;
  onClearAll: () => void;
};

const FilterPanel = ({
  categories = [],
  selectedCategories,
  onToggleCategory,
  attributes = [],
  selectedAttributes,
  onAttributeChange,
  priceBuckets,
  selectedBucket,
  onSelectBucket,
  onClearAll,
}: FilterPanelProps) => {
  const toggleValue = (attributeId: string, valueId: string) => {
    const current = selectedAttributes[attributeId] ?? [];
    const next = current.includes(valueId)
      ? current.filter((id) => id !== valueId)
      : [...current, valueId];
    onAttributeChange(attributeId, next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          onClick={onClearAll}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {priceBuckets.length > 0 && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Price</h4>
          <div className="space-y-2">
            {priceBuckets.map((bucket) => {
              const checked =
                selectedBucket?.from === bucket.from && selectedBucket?.to === bucket.to;
              return (
                <label
                  key={`${bucket.from}-${bucket.to}`}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="price-bucket"
                    checked={checked}
                    onChange={() => onSelectBucket(bucket)}
                  />
                  {formatPrice(bucket.from)} - {formatPrice(bucket.to)}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Category</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.slug)}
                  onChange={() => onToggleCategory(category.slug)}
                  className="rounded border-gray-300 text-primary focus:ring-primary/20"
                />
                {category.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {attributes.map((attribute) => {
        const activeValues = selectedAttributes[attribute.attributeId] ?? [];
        return (
          <div
            key={attribute.attributeId}
            className="space-y-3 rounded-xl border border-gray-200 p-4"
          >
            <h4 className="text-sm font-semibold text-slate-900">{attribute.name}</h4>
            <div className="space-y-2">
              {attribute.options.map((option) => (
                <label
                  key={option.valueId}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={activeValues.includes(option.valueId)}
                    onChange={() => toggleValue(attribute.attributeId, option.valueId)}
                    className="rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  {option.color ? (
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: option.color }}
                    />
                  ) : null}
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FilterPanel;

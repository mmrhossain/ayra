"use client";

import type { CategoryItem } from "@/features/shop/types";
import { formatPrice } from "@/lib/format";
import { RotateCcw } from "lucide-react";

export type { CategoryItem };

export interface CategoryAttributeOption {
  label: string;
  value: string;
}

export interface CategoryAttribute {
  id?: string;
  name: string; // e.g., "Color", "Fabric", "Size"
  key: string; // e.g., "color", "fabric", "size"
  options: CategoryAttributeOption[];
}

type FilterPanelProps = {
  categories?: string[];
  categoryObjects?: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  // Dynamic attribute filtering props
  availableAttributes?: CategoryAttribute[];
  selectedAttributes?: Record<string, string[]>;
  onAttributeChange?: (attributeKey: string, values: string[]) => void;
  // Price range props
  priceMin: number;
  priceMax: number;
  selectedPrice: { min: number; max: number };
  onPriceChange: (min: number, max: number) => void;
  onClearAll: () => void;
};

const FilterPanel = ({
  categoryObjects = [],
  selectedCategory,
  onSelectCategory,
  availableAttributes = [],
  selectedAttributes = {},
  onAttributeChange,
  priceMin,
  priceMax,
  selectedPrice,
  onPriceChange,
  onClearAll,
}: FilterPanelProps) => {
  // Toggle individual attribute options (e.g. adding or removing 'red' from 'color')
  const handleToggleAttributeOption = (attributeKey: string, optionValue: string) => {
    if (!onAttributeChange) return;

    const currentValues = selectedAttributes[attributeKey] || [];
    const isSelected = currentValues.includes(optionValue);

    const updatedValues = isSelected
      ? currentValues.filter((val) => val !== optionValue)
      : [...currentValues, optionValue];

    onAttributeChange(attributeKey, updatedValues);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
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

      {/* Categories Radio Filter */}
      {categoryObjects.length > 0 && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Categories</h4>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === "all" || !selectedCategory}
                onChange={() => onSelectCategory("all")}
              />
              All
            </label>
            {categoryObjects.map((cat, index) => (
              <label
                key={cat.id || cat.slug || index}
                className="flex cursor-pointer items-center gap-2 text-sm text-secondary"
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.slug}
                  checked={selectedCategory === cat.slug}
                  onChange={() => onSelectCategory(cat.slug)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Category Attributes */}
      {availableAttributes.map((attr) => {
        const activeValues = selectedAttributes[attr.key] || [];

        return (
          <div
            key={attr.id || attr.key}
            className="space-y-3 rounded-xl border border-gray-200 p-4"
          >
            <h4 className="text-sm font-semibold text-slate-900">{attr.name}</h4>
            <div className="space-y-2">
              {attr.options.map((option) => {
                const isChecked = activeValues.includes(option.value);

                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleAttributeOption(attr.key, option.value)}
                      className="rounded border-gray-300 text-primary focus:ring-primary/20"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Price Range Filter */}
      <div className="space-y-3 rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-slate-900">Price range</h4>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-secondary">Min</label>
            <input
              type="number"
              min={priceMin}
              max={selectedPrice.max}
              value={selectedPrice.min}
              onChange={(e) => onPriceChange(Number(e.target.value) || 0, selectedPrice.max)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-secondary">Max</label>
            <input
              type="number"
              min={selectedPrice.min}
              max={priceMax}
              value={selectedPrice.max}
              onChange={(e) => onPriceChange(selectedPrice.min, Number(e.target.value) || priceMax)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <p className="text-xs text-secondary">
          Showing products between {formatPrice(selectedPrice.min)} and{" "}
          {formatPrice(selectedPrice.max)}.
        </p>
      </div>
    </div>
  );
};

export default FilterPanel;

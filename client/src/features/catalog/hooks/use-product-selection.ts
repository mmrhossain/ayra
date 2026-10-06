"use client";

import { normalizeVariantAttributes } from "@/features/catalog/api";
import type { ProductDetail, ProductVariant } from "@/features/catalog/types";
import { attributeGroupsFrom, num, variantValueIds } from "@/features/catalog/utils/variants";
import { useState } from "react";

export function useProductSelection(product: ProductDetail) {
  const variants = product.variants ?? [];
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;

  const attributeGroups = attributeGroupsFrom(variants);

  const [quantity, setQuantity] = useState(1);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    if (!defaultVariant) return {};
    const initial: Record<string, string> = {};
    for (const attr of normalizeVariantAttributes(defaultVariant)) {
      initial[attr.attributeId] = attr.id;
    }
    return initial;
  });

  const isComplete = attributeGroups.every((group) => Boolean(selectedValues[group.attributeId]));

  let selected: ProductVariant | null = defaultVariant;
  if (attributeGroups.length > 0) {
    if (!isComplete) {
      selected = null;
    } else {
      const wantedSet = new Set(attributeGroups.map((group) => selectedValues[group.attributeId]));

      selected =
        variants.find((variant) => {
          const ids = variantValueIds(variant);
          if (ids.length !== wantedSet.size) return false;
          return ids.every((id) => wantedSet.has(id));
        }) ?? null;
    }
  }

  const active = selected ?? defaultVariant;
  const selectedId = selected?.id ?? null;
  const price = num(active?.price);
  const compareAt = num(active?.compareAtPrice);
  const hasDiscount = compareAt > price && price > 0;
  const discountPct = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
  const stock = num(active?.availableStock);
  const canAddToCart = Boolean(selected) && stock > 0;

  let galleryImages = active?.images ?? [];
  if (galleryImages.length === 0) {
    galleryImages = product.images ?? [];
  }

  const setAttributeValue = (attributeId: string, valueId: string) => {
    setSelectedValues((prev) => ({ ...prev, [attributeId]: valueId }));
    setQuantity(1);
  };

  return {
    attributeGroups,
    quantity,
    setQuantity,
    selectedValues,
    setAttributeValue,
    isComplete,
    selected,
    active,
    selectedId,
    price,
    compareAt,
    hasDiscount,
    discountPct,
    stock,
    canAddToCart,
    galleryImages,
  };
}

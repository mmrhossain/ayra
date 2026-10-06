"use client";

import { useState } from "react";
import { addCartItem, toCartErrorMessage } from "@/features/cart/api";
import type { ProductDetail, ProductVariant } from "@/features/catalog/types";
import { num } from "@/features/catalog/utils/variants";
import { errorToast, successToast } from "@/helpers";
import { useCartStore } from "@/stores/useCartStore";

type AddToCartInput = {
  product: ProductDetail;
  selected: ProductVariant | null;
  isComplete: boolean;
  quantity: number;
  galleryImageUrl?: string;
};

export function useAddToCart() {
  const [cartBusy, setCartBusy] = useState(false);

  const handleAddToCart = async ({
    product,
    selected,
    isComplete,
    quantity,
    galleryImageUrl,
  }: AddToCartInput): Promise<void> => {
    if (!isComplete) {
      errorToast("Choose an option");
      return;
    }
    if (!selected) {
      errorToast("This combination is unavailable");
      return;
    }
    if (num(selected.availableStock) < 1) {
      errorToast("Out of stock");
      return;
    }
    try {
      setCartBusy(true);
      const selectedPrice = num(selected.price);
      const selectedCompareAt = num(selected.compareAtPrice);
      const selectedHasDiscount =
        selectedCompareAt > selectedPrice && selectedPrice > 0;
      const result = await addCartItem(selected.id, quantity, {
        productName: product.name,
        productSlug: product.slug,
        productImage: galleryImageUrl,
        sku: selected.sku,
        unitPrice: selectedPrice,
        compareAtPrice: selectedHasDiscount ? selectedCompareAt : null,
      });
      await useCartStore.getState().fetchCart();
      successToast(result.message);
    } catch (err) {
      errorToast(toCartErrorMessage(err));
    } finally {
      setCartBusy(false);
    }
  };

  return { cartBusy, handleAddToCart };
}

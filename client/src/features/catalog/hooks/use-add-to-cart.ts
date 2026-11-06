"use client";

import { useState } from "react";
import { addCartItem, toCartErrorMessage } from "@/features/cart/api";
import type { ProductDetail, ProductVariant } from "@/features/catalog/types";
import { num } from "@/features/catalog/utils/variants";
import { errorToast, successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole, STAFF_CANNOT_SHOP_MESSAGE, staffShoppingRedirect } from "@/lib/api/auth/roles";
import { useCartStore } from "@/stores/useCartStore";
import { useRouter } from "next/navigation";

type AddToCartInput = {
  product: ProductDetail;
  selected: ProductVariant | null;
  isComplete: boolean;
  quantity: number;
  galleryImageUrl?: string;
};

export function useAddToCart() {
  const [cartBusy, setCartBusy] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();

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
    const dest = staffShoppingRedirect(session?.user?.role);
    if (dest || isStaffRole(session?.user?.role)) {
      errorToast(STAFF_CANNOT_SHOP_MESSAGE);
      if (dest) router.push(dest);
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

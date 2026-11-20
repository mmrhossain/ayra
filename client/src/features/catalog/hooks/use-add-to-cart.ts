"use client";

import { useRef, useState } from "react";
import { toCartErrorMessage } from "@/features/cart/api";
import { normalizeVariantAttributes } from "@/features/catalog/api";
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
  const inFlight = useRef(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleAddToCart = async ({
    product,
    selected,
    isComplete,
    quantity,
    galleryImageUrl,
  }: AddToCartInput): Promise<void> => {
    if (inFlight.current) return;
    // Missing-option errors are shown beside the attribute controls.
    if (!isComplete) return;
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
    inFlight.current = true;
    try {
      setCartBusy(true);
      const selectedPrice = num(selected.price);
      const selectedCompareAt = num(selected.compareAtPrice);
      const selectedHasDiscount =
        selectedCompareAt > selectedPrice && selectedPrice > 0;
      const result = await useCartStore.getState().addToCart(selected.id, quantity, {
        productName: product.name,
        productSlug: product.slug,
        productImage: galleryImageUrl,
        sku: selected.sku,
        attributes: normalizeVariantAttributes(selected).map((attribute) => ({
          name: attribute.attributeName ?? "Option",
          value: attribute.value,
        })),
        unitPrice: selectedPrice,
        compareAtPrice: selectedHasDiscount ? selectedCompareAt : null,
      });
      successToast(result.message);
    } catch (err) {
      errorToast(toCartErrorMessage(err));
    } finally {
      inFlight.current = false;
      setCartBusy(false);
    }
  };

  return { cartBusy, handleAddToCart };
}

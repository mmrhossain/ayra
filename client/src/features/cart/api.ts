/**
 * Guest cart lives in localStorage until login.
 * Logged-in cart lives in `@/features/dashboard/customer/cart/api/cart`.
 */
import { ApiError } from "@/lib/api/store-front";
import {
  addAuthCartItem,
  applyCartCoupon as applyAuthCartCoupon,
  fetchAuthCartSnapshot,
  isCartUnauthorized,
  mergeGuestCartOnLogin as mergeAuthGuestCart,
  removeAuthCartItem,
  removeCartCoupon as removeAuthCartCoupon,
  toCartErrorMessage as toAuthCartErrorMessage,
  updateAuthCartItem,
} from "@/features/dashboard/customer/cart/api/cart";
import type {
  CartItemSnapshot,
  CartLine,
  CartSnapshot,
  GuestCartLine,
} from "@/features/cart/types";
import {
  clearGuestCart,
  readGuestCart,
  writeGuestCart,
} from "@/features/cart/guest-storage";
import { authClient } from "@/lib/api/auth/auth-client";

export type { CartItemSnapshot, CartLine, CartSnapshot } from "@/features/cart/types";

async function hasAuthSession(): Promise<boolean> {
  try {
    const { data } = await authClient.getSession();
    return Boolean(data?.user);
  } catch {
    return false;
  }
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function emptyCart(): CartSnapshot {
  return {
    items: [],
    couponCode: null,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    shippingAmount: 0,
    grandTotal: 0,
  };
}

function mapGuestLine(line: GuestCartLine): CartLine {
  const quantity = Math.max(1, num(line.quantity));
  const unitPrice = num(line.unitPrice);
  return {
    id: line.variantId,
    variantId: line.variantId,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
    productName: line.productName || "Product",
    productSlug: line.productSlug,
    productImage: line.productImage,
    sku: line.sku,
    compareAtPrice:
      line.compareAtPrice != null ? num(line.compareAtPrice) : null,
  };
}

function mapGuestCart(items: GuestCartLine[]): CartSnapshot {
  const mapped = items.map(mapGuestLine);
  const subtotal = mapped.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    items: mapped,
    couponCode: null,
    subtotal,
    discountAmount: 0,
    taxAmount: 0,
    shippingAmount: 0,
    grandTotal: subtotal,
  };
}

export async function fetchGuestCartSnapshot(): Promise<CartSnapshot> {
  const items = readGuestCart();
  if (items.length === 0) return emptyCart();
  return mapGuestCart(items);
}

export async function fetchCartSnapshot(): Promise<CartSnapshot> {
  if (await hasAuthSession()) {
    try {
      return await fetchAuthCartSnapshot();
    } catch (err) {
      if (!isCartUnauthorized(err)) throw err;
    }
  }
  return fetchGuestCartSnapshot();
}

export async function addCartItem(
  variantId: string,
  quantity: number,
  snapshot: CartItemSnapshot = {},
): Promise<{ message: string }> {
  if (await hasAuthSession()) {
    try {
      return await addAuthCartItem(variantId, quantity);
    } catch (err) {
      if (!isCartUnauthorized(err)) throw err;
    }
  }

  const items = readGuestCart();
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) {
    existing.quantity = num(existing.quantity) + quantity;
    if (snapshot.productName) existing.productName = snapshot.productName;
    if (snapshot.productSlug !== undefined)
      existing.productSlug = snapshot.productSlug;
    if (snapshot.productImage !== undefined)
      existing.productImage = snapshot.productImage;
    if (snapshot.sku) existing.sku = snapshot.sku;
    if (snapshot.unitPrice != null) existing.unitPrice = snapshot.unitPrice;
    if (snapshot.compareAtPrice !== undefined)
      existing.compareAtPrice = snapshot.compareAtPrice;
  } else {
    items.push({
      variantId,
      quantity,
      productName: snapshot.productName,
      productSlug: snapshot.productSlug,
      productImage: snapshot.productImage,
      sku: snapshot.sku,
      unitPrice: snapshot.unitPrice,
      compareAtPrice: snapshot.compareAtPrice,
    });
  }
  writeGuestCart(items);
  return { message: "Item added to cart" };
}

export async function updateCartItem(
  variantId: string,
  quantity: number,
): Promise<{ message: string }> {
  if (await hasAuthSession()) {
    try {
      return await updateAuthCartItem(variantId, quantity);
    } catch (err) {
      if (!isCartUnauthorized(err)) throw err;
    }
  }

  const items = readGuestCart();
  const existing = items.find((item) => item.variantId === variantId);
  if (!existing) throw new Error("Item not in cart");
  existing.quantity = quantity;
  writeGuestCart(items);
  return { message: "Cart item updated" };
}

export async function removeCartItem(
  variantId: string,
): Promise<{ message: string }> {
  if (await hasAuthSession()) {
    try {
      return await removeAuthCartItem(variantId);
    } catch (err) {
      if (!isCartUnauthorized(err)) throw err;
    }
  }

  writeGuestCart(readGuestCart().filter((item) => item.variantId !== variantId));
  return { message: "Item removed from cart" };
}

export async function applyCartCoupon(
  code: string,
): Promise<{ message: string }> {
  return applyAuthCartCoupon(code);
}

export async function removeCartCoupon(): Promise<{ message: string }> {
  return removeAuthCartCoupon();
}

export async function mergeGuestCartOnLogin(): Promise<void> {
  const items = readGuestCart().map((item) => ({
    variantId: item.variantId,
    quantity: Math.max(1, num(item.quantity)),
  }));
  if (items.length === 0) return;
  await mergeAuthGuestCart(items);
  clearGuestCart();
}

export function toCartErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Please sign in to continue";
    if (err.status === 403) {
      return err.message || "Staff accounts cannot shop. Sign in with a customer account.";
    }
    return err.message;
  }
  return toAuthCartErrorMessage(err);
}

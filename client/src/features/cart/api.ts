/**
 * Guest cart lives in localStorage until login.
 * Logged-in cart lives in `@/features/dashboard/customer/cart/api/cart`.
 */
import { api, ApiError, type Envelope } from "@/lib/api/store-front";
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
  AvailableCartCoupon,
  CartItemSnapshot,
  CartLine,
  CartMutationResult,
  CartSnapshot,
  GuestCartLine,
} from "@/features/cart/types";
import {
  clearGuestCart,
  readGuestCart,
  writeGuestCart,
} from "@/features/cart/guest-storage";

export type { CartItemSnapshot, CartLine, CartSnapshot } from "@/features/cart/types";

export async function fetchAvailableCartCoupons(signal?: AbortSignal) {
  const response = await api.get<Envelope<AvailableCartCoupon[]>>("/cart/coupons", {
    cache: "no-store",
    signal,
  });
  return response.data;
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
    attributes: line.attributes,
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
  const local = mapGuestCart(items);
  const response = await api.post<Envelope<Omit<CartSnapshot, "items" | "couponCode"> & { items: Array<{ variantId: string; unitPrice: number; quantity: number; subtotal: number }> }>>("/cart/guest/quote", {
    body: { items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) },
    cache: "no-store",
  });
  const byId = new Map(local.items.map(item => [item.variantId, item]));
  return { ...local, ...response.data, couponCode: null,
    items: response.data.items.flatMap(item => { const snapshot = byId.get(item.variantId); return snapshot ? [{ ...snapshot, ...item }] : []; }),
  };
}

export async function fetchCartSnapshot(owner?: "guest" | "customer"): Promise<CartSnapshot> {
  if (owner === "guest") return fetchGuestCartSnapshot();
  if (owner === "customer") return fetchAuthCartSnapshot();
  try {
    return await fetchAuthCartSnapshot();
  } catch (err) {
    if (!isCartUnauthorized(err)) throw err;
  }
  return fetchGuestCartSnapshot();
}

export async function addCartItem(
  variantId: string,
  quantity: number,
  snapshot: CartItemSnapshot = {},
  owner?: "guest" | "customer",
): Promise<CartMutationResult> {
  if (owner !== "guest") {
    try {
      return await addAuthCartItem(variantId, quantity);
    } catch (err) {
      if (owner === "customer" || !isCartUnauthorized(err)) throw err;
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
    if (snapshot.attributes) existing.attributes = snapshot.attributes;
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
      attributes: snapshot.attributes,
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
  owner?: "guest" | "customer",
): Promise<CartMutationResult> {
  if (owner !== "guest") {
    try {
      return await updateAuthCartItem(variantId, quantity);
    } catch (err) {
      if (owner === "customer" || !isCartUnauthorized(err)) throw err;
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
  owner?: "guest" | "customer",
): Promise<CartMutationResult> {
  if (owner !== "guest") {
    try {
      return await removeAuthCartItem(variantId);
    } catch (err) {
      if (owner === "customer" || !isCartUnauthorized(err)) throw err;
    }
  }

  writeGuestCart(readGuestCart().filter((item) => item.variantId !== variantId));
  return { message: "Item removed from cart" };
}

export async function applyCartCoupon(
  code: string,
): Promise<CartMutationResult> {
  return applyAuthCartCoupon(code);
}

export async function removeCartCoupon(): Promise<CartMutationResult> {
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

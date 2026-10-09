/**
 * Guest cart + storefront facade. Guest transport uses the store-front client.
 * Logged-in cart lives in `@/features/dashboard/customer/cart/api/cart`.
 */
import { api, ApiError } from "@/lib/api/store-front";
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
  Envelope,
  GuestCartLine,
  GuestCartRecord,
} from "@/features/cart/types";
import {
  clearGuestSessionId,
  getGuestSessionId,
  getOrCreateGuestSessionId,
} from "@/helpers";
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

function guestLinesFrom(data: GuestCartRecord | null | undefined): GuestCartLine[] {
  const lines = data?.items ?? data?.cartData?.items ?? [];
  return lines.filter((line) => line?.variantId);
}

function mapGuestCart(data: unknown): CartSnapshot {
  if (!data || typeof data !== "object") return emptyCart();
  const items = guestLinesFrom(data as GuestCartRecord).map(mapGuestLine);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    items,
    couponCode: null,
    subtotal,
    discountAmount: 0,
    taxAmount: 0,
    shippingAmount: 0,
    grandTotal: subtotal,
  };
}

async function fetchGuestLines(sessionId: string): Promise<GuestCartLine[]> {
  const res = await api.get<Envelope<GuestCartRecord | null>>("/cart/guest", {
    params: { sessionId },
    cache: "no-store",
  });
  return guestLinesFrom(res.data);
}

async function saveGuestLines(
  sessionId: string,
  items: GuestCartLine[],
): Promise<void> {
  await api.put<Envelope<unknown>>("/cart/guest", {
    body: { sessionId, cartData: { items } },
  });
}

export async function fetchGuestCartSnapshot(): Promise<CartSnapshot> {
  const sessionId = getGuestSessionId();
  if (!sessionId) return emptyCart();
  const res = await api.get<Envelope<GuestCartRecord | null>>("/cart/guest", {
    params: { sessionId },
    cache: "no-store",
  });
  return mapGuestCart(res.data);
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

  const sessionId = getOrCreateGuestSessionId();
  const items = await fetchGuestLines(sessionId);
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
  await saveGuestLines(sessionId, items);
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

  const sessionId = getGuestSessionId();
  if (!sessionId) throw new Error("Cart is empty");
  const items = await fetchGuestLines(sessionId);
  const existing = items.find((item) => item.variantId === variantId);
  if (!existing) throw new Error("Item not in cart");
  existing.quantity = quantity;
  await saveGuestLines(sessionId, items);
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

  const sessionId = getGuestSessionId();
  if (!sessionId) throw new Error("Cart is empty");
  const items = (await fetchGuestLines(sessionId)).filter(
    (item) => item.variantId !== variantId,
  );
  await saveGuestLines(sessionId, items);
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
  const sessionId = getGuestSessionId();
  if (!sessionId) return;
  await mergeAuthGuestCart(sessionId);
  clearGuestSessionId();
}

export function toCartErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Please sign in to continue";
    return err.message;
  }
  return toAuthCartErrorMessage(err);
}

/**
 * Authenticated customer cart. Dashboard client only.
 * Guest cart lives in `@/features/cart/api` (store-front client).
 */
import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";

type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productName: string;
  productSlug?: string | null;
  productImage?: string | null;
  sku?: string;
  compareAtPrice?: number | null;
};

export type CartSnapshot = {
  items: CartLine[];
  couponCode: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  grandTotal: number;
};

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

function mapAuthItem(item: Record<string, unknown>): CartLine | null {
  const variant = (item.variant ?? null) as Record<string, unknown> | null;
  const variantId = String(item.variantId ?? variant?.id ?? "");
  if (!variantId) return null;
  const quantity = Math.max(1, num(item.quantity));
  const unitPrice = num(item.unitPrice ?? variant?.price);
  const product = (variant?.product ?? null) as Record<string, unknown> | null;
  const compareAt = item.compareAtPrice ?? variant?.compareAtPrice;
  return {
    id: String(item.id ?? variantId),
    variantId,
    quantity,
    unitPrice,
    subtotal: num(item.subtotal) || unitPrice * quantity,
    productName: String(item.productName ?? product?.name ?? "Product"),
    productSlug: (item.productSlug ?? product?.slug ?? null) as string | null,
    productImage: (item.productImage ?? null) as string | null,
    sku: (item.sku ?? variant?.sku) as string | undefined,
    compareAtPrice: compareAt != null ? num(compareAt) : null,
  };
}

function mapAuthCart(data: unknown): CartSnapshot {
  if (!data || typeof data !== "object") return emptyCart();
  const cart = data as Record<string, unknown>;
  const rawItems = Array.isArray(cart.items) ? cart.items : [];
  const items = rawItems
    .map((item) => mapAuthItem(item as Record<string, unknown>))
    .filter((item): item is CartLine => item !== null);
  const coupon = (cart.coupon ?? null) as Record<string, unknown> | null;
  const couponCode =
    (coupon?.couponCode as string | undefined) ??
    (coupon?.code as string | undefined) ??
    null;
  return {
    items,
    couponCode,
    subtotal: num(cart.subtotal),
    discountAmount: num(cart.discountAmount),
    taxAmount: num(cart.taxAmount),
    shippingAmount: num(cart.shippingAmount),
    grandTotal: num(cart.grandTotal),
  };
}

export function isCartUnauthorized(err: unknown): boolean {
  return err instanceof DashboardApiError && err.status === 401;
}

export async function fetchAuthCartSnapshot(): Promise<CartSnapshot> {
  const res = await dashboardApi.get<Envelope<unknown>>("/cart", {
    cache: "no-store",
  });
  return mapAuthCart(res.data);
}

export async function addAuthCartItem(
  variantId: string,
  quantity: number,
): Promise<{ message: string }> {
  const res = await dashboardApi.post<Envelope<unknown>>("/cart/items", {
    body: { variantId, quantity },
  });
  return { message: res.message || "Item added to cart" };
}

export async function updateAuthCartItem(
  variantId: string,
  quantity: number,
): Promise<{ message: string }> {
  const res = await dashboardApi.put<Envelope<unknown>>(
    `/cart/items/${variantId}`,
    { body: { quantity } },
  );
  return { message: res.message || "Cart item updated" };
}

export async function removeAuthCartItem(
  variantId: string,
): Promise<{ message: string }> {
  const res = await dashboardApi.delete<Envelope<unknown>>(
    `/cart/items/${variantId}`,
  );
  return { message: res.message || "Item removed from cart" };
}

export async function applyCartCoupon(
  code: string,
): Promise<{ message: string }> {
  const res = await dashboardApi.post<Envelope<unknown>>("/cart/coupon", {
    body: { code: code.trim() },
  });
  return { message: res.message || "Coupon applied" };
}

export async function removeCartCoupon(): Promise<{ message: string }> {
  const res = await dashboardApi.delete<Envelope<unknown>>("/cart/coupon");
  return { message: res.message || "Coupon removed" };
}

export async function mergeGuestCartOnLogin(
  sessionId: string,
): Promise<void> {
  await dashboardApi.post<Envelope<unknown>>("/cart/guest/merge", {
    body: { sessionId },
  });
}

export function toCartErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) {
    if (err.status === 401) return "Please sign in to continue";
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

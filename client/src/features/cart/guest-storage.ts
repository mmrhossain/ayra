import type { GuestCartLine } from "@/features/cart/types";

const GUEST_CART_KEY = "ayra.guest_cart";
const MAX_LINES = 100;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readGuestCart(): GuestCartLine[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: GuestCartLine[] } | GuestCartLine[];
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) return [];
    return items
      .filter((line) => line?.variantId && Number(line.quantity) > 0)
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartLine[]): void {
  if (!canUseStorage()) return;
  const next = items
    .filter((line) => line?.variantId && Number(line.quantity) > 0)
    .slice(0, MAX_LINES);
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify({ items: next }));
}

export function clearGuestCart(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(GUEST_CART_KEY);
}

import type { CartLine } from "@/features/cart/api";

export type CartItem = CartLine;

export interface CartState {
  cart: CartItem[] | null;
  cartCount: number;
  discount: number;
  totalAmount: number;
  discountAmount: number;
  vatAmount: number;
  payableAmount: number;
  couponCode: string | null;
  cartLoading: Record<string, boolean>;
  setCartLoading: (id: string, loading: boolean) => void;
  fetchCart: () => Promise<void>;
  updateCart: (
    variantId: string,
    quantity: number,
  ) => Promise<{ message: string }>;
  removeFromCart: (variantId: string) => Promise<{ message: string }>;
  applyCoupon: (code: string) => Promise<{ message: string }>;
  removeCoupon: () => Promise<{ message: string }>;
  clearCart: () => void;
}

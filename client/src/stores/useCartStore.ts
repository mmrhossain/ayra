import {
  applyCartCoupon,
  fetchCartSnapshot,
  removeCartCoupon,
  removeCartItem,
  updateCartItem,
} from "@/features/cart/api";
import { customerCartRequest } from "@/features/cart/cart-request";
import { CartState } from "@/features/cart/types";
import { create } from "zustand";

let cartFetchVersion = 0;

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  totalAmount: 0,
  discount: 0,
  discountAmount: 0,
  vatAmount: 0,
  taxRates: [],
  payableAmount: 0,
  couponCode: null,
  cartCount: 0,
  cartLoading: {},

  setCartLoading: (id: string, value: boolean) =>
    set((state) => ({
      cartLoading: {
        ...state.cartLoading,
        [id]: value,
      },
    })),

  fetchCart: async () => {
    const version = ++cartFetchVersion;
    try {
      const snapshot = await fetchCartSnapshot();
      if (version !== cartFetchVersion) return;
      set({
        cart: snapshot.items,
        cartCount: snapshot.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: snapshot.subtotal,
        discountAmount: snapshot.discountAmount,
        vatAmount: snapshot.taxAmount,
        taxRates: snapshot.taxRates ?? [],
        payableAmount: snapshot.grandTotal,
        couponCode: snapshot.couponCode,
      });
    } catch {
      if (version !== cartFetchVersion) return;
      set({
        cart: [],
        cartCount: 0,
        totalAmount: 0,
        discountAmount: 0,
        vatAmount: 0,
        taxRates: [],
        payableAmount: 0,
        couponCode: null,
      });
    }
  },

  updateCart: async (variantId: string, quantity: number) => {
    const res = await updateCartItem(variantId, quantity);
    await get().fetchCart();
    return res;
  },

  removeFromCart: async (variantId: string) => {
    const res = await removeCartItem(variantId);
    await get().fetchCart();
    return res;
  },

  applyCoupon: async (code: string) => {
    const res = await applyCartCoupon(code);
    await get().fetchCart();
    return res;
  },

  removeCoupon: async () => {
    const res = await removeCartCoupon();
    await get().fetchCart();
    return res;
  },

  clearCart: () => {
    cartFetchVersion += 1;
    customerCartRequest.invalidate();
    set({
      cart: [],
      cartCount: 0,
      totalAmount: 0,
      discountAmount: 0,
      vatAmount: 0,
      taxRates: [],
      payableAmount: 0,
      couponCode: null,
    });
  },
}));

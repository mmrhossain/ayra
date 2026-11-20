import {
  addCartItem,
  applyCartCoupon,
  fetchCartSnapshot,
  removeCartCoupon,
  removeCartItem,
  updateCartItem,
} from "@/features/cart/api";
import { customerCartRequest } from "@/features/cart/cart-request";
import type { CartMutationResult, CartSnapshot, CartState } from "@/features/cart/types";
import { create } from "zustand";

let cartFetchVersion = 0;
let resolvedOwner: "guest" | "customer" | undefined;
const newMutationBatch = () => ({ pending: 0, overlapped: false, refresh: false });
let mutationBatch = newMutationBatch();

function snapshotState(snapshot: CartSnapshot) {
  return {
    cart: snapshot.items,
    cartCount: snapshot.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: snapshot.subtotal,
    discountAmount: snapshot.discountAmount,
    vatAmount: snapshot.taxAmount,
    taxRates: snapshot.taxRates ?? [],
    payableAmount: snapshot.grandTotal,
    couponCode: snapshot.couponCode,
  };
}

async function mutateCart(mutation: () => Promise<CartMutationResult>) {
  const batch = mutationBatch;
  batch.pending += 1;
  if (batch.pending > 1) batch.overlapped = true;
  try {
    const result = await mutation();
    if (batch === mutationBatch) {
      if (batch.overlapped || !result.snapshot) {
        batch.refresh = true;
      } else {
        cartFetchVersion += 1;
        useCartStore.setState(snapshotState(result.snapshot));
      }
    }
    return { message: result.message };
  } finally {
    batch.pending -= 1;
    if (batch === mutationBatch && batch.pending === 0) {
      mutationBatch = newMutationBatch();
      if (batch.refresh) await useCartStore.getState().fetchCart();
    }
  }
}

export const useCartStore = create<CartState>((set) => ({
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

  fetchCart: async (owner) => {
    if (owner) resolvedOwner = owner;
    const version = ++cartFetchVersion;
    try {
      const snapshot = await fetchCartSnapshot(resolvedOwner);
      if (version !== cartFetchVersion) return;
      set(snapshotState(snapshot));
    } catch (error) {
      if (version === cartFetchVersion && owner) throw error;
    }
  },

  addToCart: (variantId, quantity, snapshot) =>
    mutateCart(() => addCartItem(variantId, quantity, snapshot, resolvedOwner)),
  updateCart: (variantId, quantity) =>
    mutateCart(() => updateCartItem(variantId, quantity, resolvedOwner)),
  removeFromCart: (variantId) => mutateCart(() => removeCartItem(variantId, resolvedOwner)),
  applyCoupon: (code) => mutateCart(() => applyCartCoupon(code)),
  removeCoupon: () => mutateCart(removeCartCoupon),

  clearCart: () => {
    cartFetchVersion += 1;
    resolvedOwner = undefined;
    mutationBatch = newMutationBatch();
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

import type {
  CartLine as AuthCartLine,
  CartSnapshot as AuthCartSnapshot,
} from "@/features/dashboard/customer/cart/api/cart";

export type { Envelope } from "@/lib/api/http";

export type CartLine = AuthCartLine;
export type CartSnapshot = AuthCartSnapshot;

export type CartItemSnapshot = {
  productName?: string;
  productSlug?: string | null;
  productImage?: string | null;
  sku?: string;
  unitPrice?: number;
  compareAtPrice?: number | null;
};

export type GuestCartLine = {
  variantId: string;
  quantity: number;
  productName?: string;
  productSlug?: string | null;
  productImage?: string | null;
  sku?: string;
  unitPrice?: number;
  compareAtPrice?: number | null;
};

export type CartItem = CartLine;

export type CartState = {
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
};

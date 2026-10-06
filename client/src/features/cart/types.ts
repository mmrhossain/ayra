import type {
  CartLine as AuthCartLine,
  CartSnapshot as AuthCartSnapshot,
} from "@/features/dashboard/customer/cart/api/cart";

export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

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

export type GuestCartRecord = {
  sessionId?: string;
  items?: GuestCartLine[];
  cartData?: { items?: GuestCartLine[] } | null;
};

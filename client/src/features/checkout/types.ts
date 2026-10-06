export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type CustomerCartItem = {
  id: string;
  quantity: number;
  unitPrice?: number | string;
  subtotal?: number | string;
  productImage?: string | null;
  productName?: string;
  productSlug?: string | null;
  sku?: string;
  variant?: {
    id: string;
    sku?: string;
    price: number | string;
    product?: {
      id: string;
      name: string;
      slug?: string;
    } | null;
  } | null;
};

export type CustomerCart = {
  items: CustomerCartItem[];
  coupon?: { code?: string; couponCode?: string } | null;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  shippingAmount?: number | string;
  grandTotal: number | string;
};

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  email?: string;
  country: string;
  division: string;
  district: string;
  thana?: string;
  postalCode?: string;
  addressLine1: string;
  addressLine2?: string;
};

export type CheckoutPayload = {
  paymentMethod: "COD" | "SSLCOMMERZ";
  billingAddress: CheckoutAddress;
  shippingAddress?: CheckoutAddress;
  shippingMethodCode: string;
  couponCode?: string;
  notes?: string;
};

export type InitiatePaymentResult = {
  payment?: {
    id: string;
    method: string;
    status: string;
  };
  paymentId?: string;
  method?: string;
  status?: string;
  checkoutUrl?: string | null;
  redirectUrl?: string | null;
  GatewayPageURL?: string | null;
} & Record<string, unknown>;

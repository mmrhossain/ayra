import type {
  CustomerOrder,
  CustomerOrderListItem,
} from "@/features/dashboard/customer/orders/types";

export type { Envelope } from "@/lib/api/http";

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
    attributes?: Array<{
      attributeValue?: {
        value: string;
        attribute?: { name: string };
      };
    }>;
    product?: {
      id: string;
      name: string;
      slug?: string;
      images?: Array<{ imageUrl?: string; isPrimary?: boolean }>;
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
  divisionCode?: string;
  districtCode?: string;
  upazilaCode?: string;
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
  expectedSubtotal?: number;
  acceptPriceChange?: boolean;
};

export type PlaceOrderInput = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  country: string;
  postal_code?: string;
  division: string;
  district: string;
  thana: string;
  divisionCode: string;
  districtCode: string;
  upazilaCode: string;
  couponCode?: string;
  paymentMethod: "COD" | "SSLCOMMERZ";
  shippingMethodCode: string;
  expectedSubtotal?: number;
  acceptPriceChange?: boolean;
};

export type OrderState = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  orders: CustomerOrderListItem[] | null;
  currentOrder: CustomerOrder | null;
  createOrder: (
    data: PlaceOrderInput,
    idempotencyKey: string,
  ) => Promise<{ message: string; data: CustomerOrder }>;
  fetchOrderList: () => Promise<CustomerOrderListItem[]>;
  fetchOrderById: (id: string) => Promise<CustomerOrder>;
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

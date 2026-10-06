import { dashboardApi } from "@/lib/api/dashboard";
import type { CustomerOrder } from "@/features/dashboard/customer/orders/types";
import type {
  CheckoutPayload,
  CustomerCart,
  Envelope,
  InitiatePaymentResult,
} from "@/features/checkout/types";

export type {
  CheckoutAddress,
  CheckoutPayload,
  CustomerCart,
  CustomerCartItem,
  Envelope,
  InitiatePaymentResult,
} from "@/features/checkout/types";

export { toCustomerApiError } from "@/features/dashboard/customer/orders/utils";

export async function placeOrder(
  body: CheckoutPayload,
): Promise<{ message: string; data: CustomerOrder }> {
  const res = await dashboardApi.post<Envelope<CustomerOrder>>("/checkout", {
    body,
  });
  return { message: res.message, data: res.data };
}

export function pickGatewayUrl(
  data: InitiatePaymentResult | null | undefined,
): string | null {
  if (!data) return null;
  const nested =
    data.payment && typeof data.payment === "object"
      ? (data.payment as Record<string, unknown>)
      : null;
  const candidates = [
    data.checkoutUrl,
    data.redirectUrl,
    data.GatewayPageURL,
    nested?.checkoutUrl,
    nested?.redirectUrl,
    nested?.GatewayPageURL,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export async function initiatePayment(
  orderId: string,
  method: CheckoutPayload["paymentMethod"],
): Promise<InitiatePaymentResult> {
  const res = await dashboardApi.post<Envelope<InitiatePaymentResult>>(
    `/payments/${orderId}/initiate`,
    { body: { method } },
  );
  return res.data;
}

export function cartCouponCode(
  cart: Pick<CustomerCart, "coupon">,
): string | null {
  return cart.coupon?.couponCode?.trim() || cart.coupon?.code?.trim() || null;
}

export async function fetchMyCart(): Promise<CustomerCart> {
  const res = await dashboardApi.get<Envelope<CustomerCart>>("/cart", {
    cache: "no-store",
  });
  const data = res.data;
  if (!data) {
    return {
      items: [],
      coupon: null,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      grandTotal: 0,
    };
  }
  return {
    ...data,
    items: data.items ?? [],
  };
}

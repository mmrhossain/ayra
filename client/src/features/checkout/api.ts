import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";
import type { CustomerOrder } from "@/features/dashboard/customer/orders/types";
import { toCustomerApiError } from "@/features/dashboard/customer/orders/utils";
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

export { toCustomerApiError };

// The server allows a 20s checkout transaction. Leave enough headroom for the
// network and for the idempotency record to be persisted before aborting.
export const CHECKOUT_FETCH_TIMEOUT_MS = 35_000;

export function toCheckoutApiError(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 503) {
    return "Checkout is taking longer than expected. Please retry; do not place a second order.";
  }
  return toCustomerApiError(err);
}

export async function placeOrder(
  body: CheckoutPayload,
  idempotencyKey: string,
): Promise<{ message: string; data: CustomerOrder }> {
  const res = await dashboardApi.post<Envelope<CustomerOrder>>("/checkout", {
    body,
    timeoutMs: CHECKOUT_FETCH_TIMEOUT_MS,
    headers: { "Idempotency-Key": idempotencyKey },
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

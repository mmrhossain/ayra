"use client";

import { cartCouponCode, fetchMyCart } from "@/features/checkout/api";
import {
  initiatePayment,
  pickGatewayUrl,
  toCustomerApiError,
  type CheckoutPayload,
} from "@/features/checkout/api";
import type { CustomerOrder } from "@/features/dashboard/customer/orders/types";
import { authClient } from "@/lib/api/auth/auth-client";
import { errorToast, successToast } from "@/helpers";
import { bdPhoneSchema } from "@/lib/validators/bangladesh";
import { locationStore } from "@/stores/location.store";
import { useOrderStore } from "@/stores/useOrderStore";
import type { Order } from "@/types/order";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function usePlaceOrder(
  paymentMethod: CheckoutPayload["paymentMethod"],
) {
  const { createOrder, loading } = useOrderStore();
  const { formState } = locationStore();
  const router = useRouter();
  const { data } = authClient.useSession();
  const user = data?.user;
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cart = await fetchMyCart();
        if (!cancelled) setCouponCode(cartCouponCode(cart));
      } catch {
        if (!cancelled) setCouponCode(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const placeOrder = useCallback(async () => {
    const {
      name,
      phone,
      email,
      address,
      country,
      division,
      district,
      thana,
      postal_code,
      shippingMethodCode,
    } = formState;

    if (!name || !phone || !address || !division || !district) {
      errorToast("Please complete your shipping address");
      return;
    }

    if (!shippingMethodCode) {
      errorToast("Please select a delivery method");
      return;
    }

    if (!bdPhoneSchema.safeParse(phone).success) {
      errorToast("Enter a valid Bangladesh phone number");
      return;
    }

    if (!user) {
      errorToast("You have to login first to place orders!");
      return;
    }

    try {
      setPlacing(true);
      const payload: Order = {
        name,
        phone,
        email: email || user.email,
        address,
        country,
        division,
        district,
        thana,
        postal_code,
        paymentMethod,
        shippingMethodCode,
        ...(couponCode ? { couponCode } : {}),
      };

      const result = await createOrder(payload);
      const order = result?.data as
        | (CustomerOrder & { orderId?: string })
        | undefined;
      const orderId = order?.id || order?.orderId;
      if (!orderId) {
        errorToast("Order was created but no order id was returned");
        return;
      }

      const initiated = await initiatePayment(orderId, paymentMethod);

      if (paymentMethod === "SSLCOMMERZ") {
        const gatewayUrl = pickGatewayUrl(initiated);
        if (!gatewayUrl) {
          errorToast("Online payment could not be started. Try again.");
          return;
        }
        window.location.href = gatewayUrl;
        return;
      }

      successToast(result.message);
      const confirmation = new URLSearchParams({ orderId });
      if (order?.orderNumber) confirmation.set("orderNumber", order.orderNumber);
      router.push(`/checkout/confirmation?${confirmation.toString()}`);
    } catch (err: unknown) {
      errorToast(toCustomerApiError(err));
    } finally {
      setPlacing(false);
    }
  }, [couponCode, createOrder, formState, paymentMethod, router, user]);

  return { placeOrder, placing, loading };
}

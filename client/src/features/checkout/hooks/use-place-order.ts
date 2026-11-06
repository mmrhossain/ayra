"use client";

import { cartCouponCode, fetchMyCart } from "@/features/checkout/api";
import {
  initiatePayment,
  pickGatewayUrl,
  toCheckoutApiError,
  type CheckoutPayload,
} from "@/features/checkout/api";
import type { CustomerOrder } from "@/features/dashboard/customer/orders/types";
import { DashboardApiError } from "@/lib/api/dashboard";
import { authClient } from "@/lib/api/auth/auth-client";
import { errorToast, successToast } from "@/helpers";
import { bdPhoneSchema } from "@/lib/validators/bangladesh";
import { locationStore } from "@/stores/location.store";
import { useOrderStore } from "@/stores/useOrderStore";
import type { PlaceOrderInput } from "@/features/checkout/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const CHECKOUT_CONFLICT_RETRY_MS = 1_500;

export type PriceChangeItem = {
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  currentUnitPrice: number;
  currentLineSubtotal: number;
};

export type PriceChangeDetails = {
  expectedSubtotal: number;
  currentSubtotal: number;
  items: PriceChangeItem[];
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function newIdempotencyKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

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
  const [expectedSubtotal, setExpectedSubtotal] = useState<number | undefined>();
  const [priceChange, setPriceChange] = useState<PriceChangeDetails | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const acceptPriceChangeRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cart = await fetchMyCart();
        if (cancelled) return;
        setCouponCode(cartCouponCode(cart));
        setExpectedSubtotal(Number(cart.subtotal ?? 0));
      } catch {
        if (!cancelled) {
          setCouponCode(null);
          setExpectedSubtotal(undefined);
        }
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
      divisionCode,
      districtCode,
      upazilaCode,
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

    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setPlacing(true);
    idempotencyKeyRef.current ??= newIdempotencyKey();
    const key = idempotencyKeyRef.current;

    const payload: PlaceOrderInput = {
      name,
      phone,
      email: email || user.email,
      address,
      country,
      division,
      district,
      thana,
      divisionCode,
      districtCode,
      upazilaCode,
      postal_code,
      paymentMethod,
      shippingMethodCode,
      ...(couponCode ? { couponCode } : {}),
      ...(expectedSubtotal !== undefined ? { expectedSubtotal } : {}),
      ...(acceptPriceChangeRef.current ? { acceptPriceChange: true } : {}),
    };

    const submit = async () => {
      try {
        return await createOrder(payload, key);
      } catch (err) {
        if (
          err instanceof DashboardApiError &&
          err.status === 409 &&
          err.code === "CART_PRICE_CHANGED"
        ) {
          throw err;
        }
        if (err instanceof DashboardApiError && err.status === 409) {
          await sleep(CHECKOUT_CONFLICT_RETRY_MS);
          return createOrder(payload, key);
        }
        throw err;
      }
    };

    try {
      const result = await submit();
      idempotencyKeyRef.current = null;
      acceptPriceChangeRef.current = false;
      setPriceChange(null);
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
      if (
        err instanceof DashboardApiError &&
        err.status === 409 &&
        err.code === "CART_PRICE_CHANGED"
      ) {
        // The 409 is stored by the idempotency middleware; a confirmation must
        // use a fresh key because the payload changes.
        idempotencyKeyRef.current = null;
        setPriceChange(err.details as PriceChangeDetails);
        return;
      }
      const status = err instanceof DashboardApiError ? err.status : 0;
      // Keep the key for network/5xx failures so a retry replays the same
      // checkout, and for 409 so a still-running checkout cannot duplicate.
      if (status >= 400 && status < 500 && status !== 409) {
        idempotencyKeyRef.current = null;
      }
      errorToast(toCheckoutApiError(err));
    } finally {
      inFlightRef.current = false;
      setPlacing(false);
    }
  }, [
    couponCode,
    createOrder,
    expectedSubtotal,
    formState,
    paymentMethod,
    router,
    user,
  ]);

  const confirmPriceChange = useCallback(() => {
    if (inFlightRef.current) return;
    acceptPriceChangeRef.current = true;
    idempotencyKeyRef.current = newIdempotencyKey();
    setPriceChange(null);
    void placeOrder();
  }, [placeOrder]);

  const dismissPriceChange = useCallback(() => {
    acceptPriceChangeRef.current = false;
    setPriceChange(null);
  }, []);

  return {
    placeOrder,
    placing,
    loading,
    priceChange,
    confirmPriceChange,
    dismissPriceChange,
  };
}

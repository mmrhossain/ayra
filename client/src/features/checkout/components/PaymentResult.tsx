"use client";

import { CheckCircle2, CircleAlert, CircleX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ResultKind = "success" | "fail" | "cancel" | "confirmation";

const copy: Record<
  ResultKind,
  {
    title: string;
    description: string;
    icon: typeof CheckCircle2;
    tone: string;
  }
> = {
  confirmation: {
    title: "Order confirmed",
    description:
      "Your cash-on-delivery order has been placed. You will pay when it arrives.",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary",
  },
  success: {
    title: "Payment submitted",
    description:
      "Your payment was verified and the order is confirmed. A confirmation email is on its way.",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary",
  },
  fail: {
    title: "Payment failed",
    description:
      "The online payment could not be verified. If money left your account, contact support with the transaction ID below.",
    icon: CircleX,
    tone: "bg-red-50 text-red-600",
  },
  cancel: {
    title: "Payment cancelled",
    description:
      "You cancelled the online payment. This page is informational only — our records update from the payment gateway IPN.",
    icon: CircleAlert,
    tone: "bg-amber-50 text-amber-700",
  },
};

function firstParam(
  params: ReturnType<typeof useSearchParams>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) return value.trim();
  }
  return null;
}

export default function PaymentResult({ kind }: { kind: ResultKind }) {
  const params = useSearchParams();
  const meta = copy[kind];
  const Icon = meta.icon;
  const orderId = firstParam(params, ["orderId", "order_id", "id"]);
  const orderNumber = firstParam(params, ["orderNumber", "order_number"]);
  const status = firstParam(params, ["status", "paymentStatus", "bank_status"]);
  const tranId = firstParam(params, ["tran_id", "tranId", "transactionId"]);

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-4 border border-gray-200 bg-white p-5 text-center shadow-sm sm:p-8">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${meta.tone}`}
        >
          <Icon aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 lg:text-3xl">
          {meta.title}
        </h1>
        <p className="text-foreground">{meta.description}</p>
        <dl className="space-y-2 border border-gray-100 bg-gray-50 p-4 text-left text-sm">
          {orderNumber ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground">Order number</dt>
              <dd className="font-medium text-slate-900">{orderNumber}</dd>
            </div>
          ) : null}
          {orderId ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground">Order id</dt>
              <dd className="font-medium text-slate-900 break-all">
                {orderId}
              </dd>
            </div>
          ) : null}
          {tranId ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground">Transaction</dt>
              <dd className="font-medium text-slate-900 break-all">{tranId}</dd>
            </div>
          ) : null}
          {status ? (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground">Reported status</dt>
              <dd className="font-medium text-slate-900 uppercase">{status}</dd>
            </div>
          ) : null}
          {!orderId && !orderNumber && !tranId && !status ? (
            <p className="text-foreground">
              No payment details were included in the URL.
            </p>
          ) : null}
        </dl>
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/customer/orders"
            className="inline-flex min-h-11 w-full items-center justify-center bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black sm:w-auto"
          >
            View orders
          </Link>
          <Link
            href="/shop"
            className="inline-flex min-h-11 w-full items-center justify-center border border-gray-200 px-5 py-3 text-sm font-semibold transition-colors hover:bg-gray-100 sm:w-auto"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

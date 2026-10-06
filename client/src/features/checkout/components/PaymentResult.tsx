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
      "SSLCommerz reported a successful checkout. Final payment status is confirmed by our server (IPN) and may take a moment to update.",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary",
  },
  fail: {
    title: "Payment failed",
    description:
      "The online payment did not complete. This page is informational only — our records update from the payment gateway IPN.",
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
    <div className="container px-4 lg:px-10 py-16">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 shadow-sm p-8 text-center space-y-4">
        <div
          className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${meta.tone}`}
        >
          <Icon />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">{meta.title}</h1>
        <p className="text-secondary">{meta.description}</p>
        <dl className="text-sm text-left space-y-2 border border-gray-100 bg-gray-50 p-4">
          {orderNumber ? (
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Order number</dt>
              <dd className="font-medium text-slate-900">{orderNumber}</dd>
            </div>
          ) : null}
          {orderId ? (
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Order id</dt>
              <dd className="font-medium text-slate-900 break-all">
                {orderId}
              </dd>
            </div>
          ) : null}
          {tranId ? (
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Transaction</dt>
              <dd className="font-medium text-slate-900 break-all">{tranId}</dd>
            </div>
          ) : null}
          {status ? (
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Reported status</dt>
              <dd className="font-medium text-slate-900 uppercase">{status}</dd>
            </div>
          ) : null}
          {!orderId && !orderNumber && !tranId && !status ? (
            <p className="text-secondary">
              No payment details were included in the URL.
            </p>
          ) : null}
        </dl>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/customer/orders"
            className="px-5 py-3 bg-primary text-white text-sm font-semibold hover:bg-black transition"
          >
            View orders
          </Link>
          <Link
            href="/shop"
            className="px-5 py-3 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

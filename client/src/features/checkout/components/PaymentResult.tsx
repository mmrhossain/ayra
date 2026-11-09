"use client";

import { CheckCircle2, CircleAlert, CircleX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";

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
    description: "Your cash-on-delivery order has been placed. You will pay when it arrives.",
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

const particles = [
  { x: -62, y: -42, rotation: -120, color: "#22c55e" },
  { x: -30, y: -70, rotation: 90, color: "#38bdf8" },
  { x: 22, y: -72, rotation: 150, color: "#fbbf24" },
  { x: 62, y: -42, rotation: -90, color: "#fb7185" },
  { x: 72, y: 12, rotation: 180, color: "#a78bfa" },
  { x: 42, y: 58, rotation: 120, color: "#22c55e" },
  { x: -24, y: 66, rotation: -150, color: "#fbbf24" },
  { x: -70, y: 18, rotation: 90, color: "#38bdf8" },
];

type ParticleStyle = CSSProperties & {
  "--particle-x": string;
  "--particle-y": string;
  "--particle-rotation": string;
};

function SuccessAnimation() {
  return (
    <div className="payment-success-animation" aria-hidden="true">
      <span className="payment-success-ring" />
      <span className="payment-success-ring payment-success-ring-delayed" />

      {particles.map((particle, index) => {
        const style: ParticleStyle = {
          "--particle-x": `${particle.x}px`,
          "--particle-y": `${particle.y}px`,
          "--particle-rotation": `${particle.rotation}deg`,
          backgroundColor: particle.color,
          animationDelay: `${0.3 + index * 0.025}s`,
        };

        return <span key={index} className="payment-success-particle" style={style} />;
      })}

      <div className="payment-success-badge">
        <svg viewBox="0 0 52 52" fill="none" className="payment-success-icon" focusable="false">
          <circle
            className="payment-success-circle"
            cx="26"
            cy="26"
            r="22"
            stroke="currentColor"
            strokeWidth="2.5"
            pathLength="1"
          />

          <path
            className="payment-success-check"
            d="M15 26.5L22.5 34L37 19"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
          />
        </svg>
      </div>
    </div>
  );
}

function firstParam(params: ReturnType<typeof useSearchParams>, keys: string[]): string | null {
  for (const key of keys) {
    const value = params.get(key)?.trim();

    if (value) return value;
  }

  return null;
}

export default function PaymentResult({ kind }: { kind: ResultKind }) {
  const params = useSearchParams();
  const meta = copy[kind];
  const Icon = meta.icon;

  const showSuccessAnimation = kind === "success" || kind === "confirmation";

  const orderNumber = firstParam(params, ["orderNumber", "order_number"]);

  const status = firstParam(params, ["status", "paymentStatus", "bank_status"]);

  const tranId = firstParam(params, ["tran_id", "tranId", "transactionId"]);

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-4 border border-gray-200 bg-white p-5 text-center shadow-sm sm:p-8">
        {showSuccessAnimation ? (
          <SuccessAnimation key={`${kind}-${orderNumber ?? tranId ?? ""}`} />
        ) : (
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${meta.tone}`}
          >
            <Icon aria-hidden="true" />
          </div>
        )}

        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 lg:text-3xl">
          {meta.title}
        </h1>

        <p className="text-foreground">{meta.description}</p>

        <dl className="space-y-2 border border-gray-100 bg-gray-50 p-4 text-left text-sm">
          {orderNumber && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-foreground">Order number</dt>

              <dd className="min-w-0 break-all text-right font-medium text-slate-900">
                {orderNumber}
              </dd>
            </div>
          )}

          {tranId && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-foreground">Transaction</dt>

              <dd className="min-w-0 break-all text-right font-medium text-slate-900">{tranId}</dd>
            </div>
          )}

          {status && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-foreground">Reported status</dt>

              <dd className="min-w-0 break-all text-right font-medium uppercase text-slate-900">
                {status}
              </dd>
            </div>
          )}

          {!orderNumber && !tranId && !status && (
            <div>
              <dt className="sr-only">Payment details</dt>
              <dd className="text-foreground">No payment details were included in the URL.</dd>
            </div>
          )}
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

"use client";

import { ArrowRight, CheckCircle2, CircleAlert, CircleX, FileText, LifeBuoy, ShoppingBag } from "lucide-react";
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
    accent: string;
    note?: string;
  }
> = {
  confirmation: {
    title: "Order confirmed",
    description: "Your cash-on-delivery order has been placed. You will pay when it arrives.",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary",
    accent: "bg-primary",
  },
  success: {
    title: "Payment submitted",
    description:
      "Your payment was verified and the order is confirmed. A confirmation email is on its way.",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary",
    accent: "bg-primary",
  },
  fail: {
    title: "Payment failed",
    description:
      "We couldn't verify this payment. You can try again from your order details while the order is active.",
    note: "If money was deducted, contact support with your transaction reference before paying again.",
    icon: CircleX,
    tone: "bg-red-50 text-red-600",
    accent: "bg-red-400",
  },
  cancel: {
    title: "Payment cancelled",
    description:
      "You cancelled this payment. You can try again from your order details while the order is active. Check your order for the latest payment status.",
    icon: CircleAlert,
    tone: "bg-amber-50 text-amber-700",
    accent: "bg-amber-400",
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

const resultContainerClass = "container flex min-h-[calc(100svh-var(--header-height,112px)-var(--bottom-nav-space,0px))] min-w-0 items-center justify-center py-8 sm:py-12";
const resultCardClass = "w-full min-w-0 max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_48px_-24px_rgba(15,23,42,0.2)]";

export function PaymentResultSkeleton() {
  return (
    <div className={resultContainerClass} role="status" aria-label="Loading payment result">
      <div className={resultCardClass} aria-hidden="true">
        <div className="h-1 bg-muted" />
        <div className="space-y-5 p-5 sm:p-8">
          <div className="mx-auto size-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="mx-auto h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mx-auto h-8 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mx-auto h-14 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-24 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
            <div className="h-12 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className={resultContainerClass}>
      <section className={resultCardClass} aria-labelledby="payment-result-title">
        <div aria-hidden="true" className={"h-1 " + meta.accent} />
        <div className="bg-gradient-to-b from-muted/30 to-transparent px-5 pb-6 pt-7 text-center sm:px-8 sm:pt-9">
          {showSuccessAnimation ? (
            <SuccessAnimation key={`${kind}-${orderNumber ?? tranId ?? ""}`} />
          ) : (
            <div className={"relative mx-auto mb-6 grid size-20 place-items-center rounded-full ring-8 ring-muted/40 sm:size-24 " + meta.tone}>
              <Icon aria-hidden="true" className="size-9 sm:size-10" strokeWidth={1.5} />
            </div>
          )}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {kind === "confirmation" ? "Order update" : "Payment update"}
          </p>
          <h1 id="payment-result-title" className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {meta.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
            {meta.description}
          </p>
        </div>

        <div className="space-y-5 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <FileText aria-hidden="true" className="size-4 shrink-0 text-primary" />
              <h2 className="text-xs font-semibold text-foreground">Payment details</h2>
            </div>
            <dl className="divide-y divide-border px-4 text-sm">
              {orderNumber && (
                <div className="grid min-w-0 gap-1.5 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                  <dt className="text-xs text-muted-foreground">Order number</dt>
                  <dd className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere] sm:text-right">{orderNumber}</dd>
                </div>
              )}
              {tranId && (
                <div className="grid min-w-0 gap-1.5 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                  <dt className="text-xs text-muted-foreground">Transaction reference</dt>
                  <dd className="min-w-0 break-all font-mono text-xs leading-relaxed text-foreground sm:text-right">{tranId}</dd>
                </div>
              )}
              {status && (
                <div className="grid min-w-0 gap-1.5 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                  <dt className="text-xs text-muted-foreground">Reported status</dt>
                  <dd className="min-w-0 text-xs font-medium uppercase text-foreground [overflow-wrap:anywhere] sm:text-right">{status}</dd>
                </div>
              )}
              {!orderNumber && !tranId && !status && (
                <div className="py-4">
                  <dt className="sr-only">Payment details</dt>
                  <dd className="text-xs leading-relaxed text-muted-foreground">No payment details were included in the URL.</dd>
                </div>
              )}
            </dl>
          </div>

          {meta.note ? (
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-3 text-amber-900">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p className="min-w-0 text-xs leading-relaxed">{meta.note}</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/customer/orders" className="group inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span>View orders</span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </Link>
            <Link href="/shop" className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <ShoppingBag aria-hidden="true" className="size-4 shrink-0" />
              <span>Continue shopping</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <LifeBuoy aria-hidden="true" className="size-3.5 shrink-0" />
            <span>Need a hand?</span>
            <Link href="/contact" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary">Contact support</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

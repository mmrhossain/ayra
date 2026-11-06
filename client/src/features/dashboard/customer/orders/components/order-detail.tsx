"use client";

import { SITE_NAME } from "@/config/site";
import {
  formatCheckoutAddress,
  pickOrderAddress,
} from "@/features/dashboard/customer/orders/api/orders";
import { CancelOrderDialog } from "@/features/dashboard/customer/orders/components/cancel-order-dialog";
import { OrderStatusPreview } from "@/features/dashboard/customer/orders/components/order-status-preview";
import { OrderDetailSkeleton } from "@/features/dashboard/customer/orders/components/order-detail-skeleton";
import { useOrderDetail } from "@/features/dashboard/customer/orders/hooks/use-order-detail";
import { ReturnRequestDialog } from "@/features/dashboard/customer/orders/components/return-request-dialog";
import type { OrderDetailProps } from "@/features/dashboard/customer/orders/types";
import { statusColor } from "@/helpers";
import { formatPrice } from "@/lib/format";
import clsx from "clsx";
import { ChevronLeft, Package, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"]);

export function OrderDetail({ initialData }: OrderDetailProps) {
  const router = useRouter();
  const orderId = initialData.id;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const { query, order: currentOrder } = useOrderDetail({
    orderId,
    initialData,
  });

  if (query.isLoading) return <OrderDetailSkeleton />;

  if (!currentOrder) {
    return (
      <div className="text-center py-24 bg-card rounded-xl border border-dashed">
        <Package className="mx-auto text-muted-foreground/60 mb-4" size={48} />
        <h3 className="text-lg font-bold text-foreground">Order not found</h3>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const items = currentOrder.items || [];
  const subtotal = Number(currentOrder.subtotal ?? 0);
  const shipping = Number(currentOrder.shippingAmount ?? 0);
  const vat = Number(currentOrder.taxAmount ?? 0);
  const grandTotal = Number(currentOrder.grandTotal ?? 0);
  const shippingAddress = formatCheckoutAddress(
    pickOrderAddress(currentOrder, "SHIPPING"),
  );
  const billingAddress = formatCheckoutAddress(
    pickOrderAddress(currentOrder, "BILLING"),
  );
  const canCancel = CANCELLABLE.has(currentOrder.status);
  const canReturn =
    currentOrder.canRequestReturn ?? currentOrder.status === "DELIVERED";
  const returnRequests = currentOrder.returnRequests ?? [];
  const refunds = (currentOrder.payments ?? []).flatMap((payment) =>
    payment.refunds.map((refund) => ({ ...refund, method: payment.method })),
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          @page {
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold"
          >
            <ChevronLeft size={18} />
            Back to Orders
          </button>
          <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:flex-col">
            {canCancel ? (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Cancel Order
              </button>
            ) : null}
            {canReturn ? (
              <button
                onClick={() => setReturnOpen(true)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground transition-colors hover:border-primary hover:bg-muted"
              >
                Request Return
              </button>
            ) : null}
            <button
              onClick={() => window.print()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-primary/90 active:scale-95"
            >
              <Printer size={16} />
              Download Invoice
            </button>
          </div>
        </div>

        {canReturn && currentOrder.returnDeadline ? (
          <p className="print:hidden text-xs text-muted-foreground">
            You can request a return until{" "}
            {new Date(currentOrder.returnDeadline).toLocaleDateString()}.
          </p>
        ) : null}

        <OrderStatusPreview
          status={currentOrder.status}
          history={currentOrder.statusHistory}
          shipments={currentOrder.shipments}
        />

        <div id="printable-invoice" className="bg-card p-2 space-y-8">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:pb-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground lg:text-3xl">
                {SITE_NAME.toUpperCase()}
              </h1>
              <div className="text-sm text-muted-foreground">
                <p>
                  Order Number:{" "}
                  <span className="font-bold text-foreground">
                    #{currentOrder.orderNumber}
                  </span>
                </p>
                <p>
                  Date: {new Date(currentOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <span
                className={clsx(
                  "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                  statusColor(currentOrder.status),
                )}
              >
                {currentOrder.status}
              </span>
            </div>
          </div>

          <div className="w-full space-y-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs font-semibold uppercase tracking-wide border-b border-border">
                  <th className="text-left py-4">Item Details</th>
                  <th className="text-right py-4">Price</th>
                  <th className="text-right py-4">Qty</th>
                  <th className="text-right py-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-5">
                      <p className="font-bold text-foreground">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.sku}
                      </p>
                    </td>
                    <td className="text-right py-5 text-muted-foreground">
                      {formatPrice(Number(item.unitPrice))}
                    </td>
                    <td className="text-right py-5 font-medium">
                      {item.quantity}
                    </td>
                    <td className="text-right py-5 font-bold text-foreground">
                      {formatPrice(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-8 border-t border-border pt-8 sm:grid-cols-2 sm:gap-10">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-1">
                  Payment Info
                </h4>
                <p className="text-xs text-muted-foreground">
                  Status: {currentOrder.paymentStatus || "PENDING"}
                </p>
              </div>
              {shippingAddress ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-1">
                    Shipping
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {shippingAddress}
                  </p>
                </div>
              ) : null}
              {billingAddress && billingAddress !== shippingAddress ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-1">
                    Billing
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {billingAddress}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Shipping
                  {currentOrder.shippingMethodName
                    ? ` (${currentOrder.shippingMethodName})`
                    : ""}
                </span>
                <span className="font-semibold tabular-nums">{formatPrice(shipping)}</span>
              </div>
              {vat > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="font-semibold tabular-nums">{formatPrice(vat)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-primary flex justify-between items-center">
                <span className="font-semibold text-xs uppercase tracking-tight">
                  Amount Due
                </span>
                <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {returnRequests.length > 0 ? (
          <div className="print:hidden rounded-xl border border-border p-4 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Return requests
            </h3>
            {returnRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-border px-3 py-2 text-sm"
              >
                <p className="font-semibold">{req.status}</p>
                <p className="text-xs text-muted-foreground">
                  {req.reason || "No reason"} · {req.items.length} item(s)
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {refunds.length > 0 ? (
          <div className="print:hidden rounded-xl border border-border p-4 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Refunds</h3>
            {refunds.map((refund) => (
              <div
                key={refund.id}
                className="rounded-xl border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{formatPrice(Number(refund.amount))}</p>
                  <span
                    className={`inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${statusColor(refund.status)}`}
                  >
                    {refund.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {refund.method}
                  {refund.reason ? ` · ${refund.reason}` : ""}
                  {refund.refundedAt
                    ? ` · ${new Date(refund.refundedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {orderId ? (
          <CancelOrderDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            orderId={orderId}
          />
        ) : null}
        {orderId ? (
          <ReturnRequestDialog
            open={returnOpen}
            onOpenChange={setReturnOpen}
            orderId={orderId}
            items={items}
          />
        ) : null}
      </div>
    </>
  );
}

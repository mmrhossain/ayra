"use client";

import { OrderInvoice } from "./order-invoice";
import { CancelOrderDialog } from "@/features/dashboard/customer/orders/components/cancel-order-dialog";
import { OrderStatusPreview } from "@/features/dashboard/customer/orders/components/order-status-preview";
import { OrderDetailSkeleton } from "@/features/dashboard/customer/orders/components/order-detail-skeleton";
import { useOrderDetail } from "@/features/dashboard/customer/orders/hooks/use-order-detail";
import { ReturnRequestDialog } from "@/features/dashboard/customer/orders/components/return-request-dialog";
import type { OrderDetailProps } from "@/features/dashboard/customer/orders/types";
import {
  initiatePayment,
  pickGatewayUrl,
} from "@/features/checkout/api";
import { toCustomerApiError } from "@/features/dashboard/customer/orders/utils";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { errorToast, statusColor } from "@/helpers";
import { formatPrice } from "@/lib/format";
import {
  ChevronLeft,
  CreditCard,
  Loader2,
  Package,
  Printer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"]);

export function OrderDetail({ initialData }: OrderDetailProps) {
  const { store } = usePublicSettings();
  const router = useRouter();
  const orderId = initialData.id;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

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
  const canCancel = CANCELLABLE.has(currentOrder.status);
  const canReturn =
    currentOrder.canRequestReturn ?? currentOrder.status === "DELIVERED";
  const canRetryPayment =
    currentOrder.status === "PENDING" &&
    currentOrder.paymentStatus !== "PAID" &&
    currentOrder.payments?.some(
      (payment) => payment.method === "SSLCOMMERZ",
    );
  const hasFailedOnlinePayment = currentOrder.payments?.some(
    (payment) =>
      payment.method === "SSLCOMMERZ" &&
      ["FAILED", "CANCELLED"].includes(payment.status),
  );
  const returnRequests = currentOrder.returnRequests ?? [];
  const refunds = (currentOrder.payments ?? []).flatMap((payment) =>
    payment.refunds.map((refund) => ({ ...refund, method: payment.method })),
  );

  const handleRetryPayment = async () => {
    if (retryingPayment) return;
    setRetryingPayment(true);
    try {
      const result = await initiatePayment(currentOrder.id, "SSLCOMMERZ");
      const gatewayUrl = pickGatewayUrl(result);
      if (!gatewayUrl) {
        errorToast("Online payment could not be started. Please try again.");
        return;
      }
      window.location.href = gatewayUrl;
    } catch (error) {
      errorToast(toCustomerApiError(error));
    } finally {
      setRetryingPayment(false);
    }
  };

  return (
    <>
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
            {canRetryPayment ? (
              <button
                type="button"
                onClick={() => void handleRetryPayment()}
                disabled={retryingPayment}
                aria-busy={retryingPayment}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary px-6 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retryingPayment ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CreditCard size={16} aria-hidden />
                )}
                {retryingPayment
                  ? "Opening payment…"
                  : hasFailedOnlinePayment
                    ? "Retry payment"
                    : "Pay online"}
              </button>
            ) : null}
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

        <OrderInvoice order={currentOrder} store={store} />

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

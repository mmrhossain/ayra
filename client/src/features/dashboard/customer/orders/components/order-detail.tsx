"use client";

import {
  formatCheckoutAddress,
  pickOrderAddress,
} from "@/features/dashboard/customer/orders/api/orders";
import { CancelOrderDialog } from "@/features/dashboard/customer/orders/components/cancel-order-dialog";
import { OrderStatusPreview } from "@/features/dashboard/customer/orders/components/order-status-preview";
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

  if (query.isLoading)
    return (
      <div className="p-8 animate-pulse text-slate-400">Loading Order...</div>
    );

  if (!currentOrder) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border border-dashed">
        <Package className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-lg font-bold text-slate-900">Order not found</h3>
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
  const canReturn = currentOrder.status === "DELIVERED";
  const returnRequests = currentOrder.returnRequests ?? [];

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
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-semibold"
          >
            <ChevronLeft size={18} />
            Back to Orders
          </button>
          <div className="flex flex-wrap gap-2">
            {canCancel ? (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all"
              >
                Cancel Order
              </button>
            ) : null}
            {canReturn ? (
              <button
                onClick={() => setReturnOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Request Return
              </button>
            ) : null}
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-primary text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              <Printer size={16} />
              Download Invoice
            </button>
          </div>
        </div>

        <OrderStatusPreview
          status={currentOrder.status}
          history={currentOrder.statusHistory}
        />

        <div id="printable-invoice" className="bg-white p-2 space-y-8">
          <div className="flex justify-between items-start border-b border-slate-100 pb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">
                RAANGALAY
              </h1>
              <div className="text-sm text-slate-500">
                <p>
                  Order Number:{" "}
                  <span className="font-bold text-slate-900">
                    #{currentOrder.orderNumber}
                  </span>
                </p>
                <p>
                  Date: {new Date(currentOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={clsx(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  statusColor(currentOrder.status),
                )}
              >
                {currentOrder.status}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="text-left py-4">Item Details</th>
                  <th className="text-right py-4">Price</th>
                  <th className="text-right py-4">Qty</th>
                  <th className="text-right py-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-5">
                      <p className="font-bold text-slate-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {item.sku}
                      </p>
                    </td>
                    <td className="text-right py-5 text-slate-600">
                      {formatPrice(Number(item.unitPrice))}
                    </td>
                    <td className="text-right py-5 font-medium">
                      {item.quantity}
                    </td>
                    <td className="text-right py-5 font-bold text-slate-900">
                      {formatPrice(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                  Payment Info
                </h4>
                <p className="text-xs text-slate-600">
                  Status: {currentOrder.paymentStatus || "PENDING"}
                </p>
              </div>
              {shippingAddress ? (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Shipping
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {shippingAddress}
                  </p>
                </div>
              ) : null}
              {billingAddress && billingAddress !== shippingAddress ? (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Billing
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {billingAddress}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Shipping
                  {currentOrder.shippingMethodName
                    ? ` (${currentOrder.shippingMethodName})`
                    : ""}
                </span>
                <span className="font-semibold">{formatPrice(shipping)}</span>
              </div>
              {vat > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">VAT</span>
                  <span className="font-semibold">{formatPrice(vat)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-900 flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-tighter">
                  Amount Due
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {returnRequests.length > 0 ? (
          <div className="print:hidden rounded-2xl border border-slate-100 p-4 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Return requests
            </h3>
            {returnRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-slate-100 px-3 py-2 text-sm"
              >
                <p className="font-semibold">{req.status}</p>
                <p className="text-xs text-slate-500">
                  {req.reason || "No reason"} · {req.items.length} item(s)
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

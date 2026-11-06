"use client";

import { statusColor } from "@/helpers";
import {
  toOrderStatusPreview,
  type OrderStatusHistoryEntry,
} from "@/features/dashboard/customer/orders/utils/status-preview";
import type { CustomerShipment } from "@/features/dashboard/customer/orders/types";
import {
  formatTrackingDate,
  SHIPMENT_STATUS_LABELS,
} from "@/features/tracking/api/tracking";
import clsx from "clsx";
import { Check, CircleAlert, ExternalLink, PackageCheck } from "lucide-react";
import Link from "next/link";

const EXCEPTION_COPY: Record<string, string> = {
  CANCELLED: "This order was cancelled and will not continue through delivery.",
  RETURN_REQUESTED: "A return has been requested. We will review it shortly.",
  RETURNED: "This order was returned.",
  REFUNDED: "This order was refunded.",
};

type OrderStatusPreviewProps = {
  status: string;
  history?: OrderStatusHistoryEntry[];
  shipments?: CustomerShipment[];
};

const formatWhen = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const OrderStatusPreview = ({
  status,
  history = [],
  shipments = [],
}: OrderStatusPreviewProps) => {
  const preview = toOrderStatusPreview(status, history);
  const currentStep = preview.steps[preview.currentIndex];
  const exceptionCopy = preview.exception
    ? EXCEPTION_COPY[preview.exception]
    : null;

  return (
    <section
      className="print:hidden space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6"
      aria-label="Order status"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-foreground">Order status</h2>
        <p className="text-sm text-muted-foreground">
          {preview.exception
            ? exceptionCopy
            : currentStep?.copy}
        </p>
      </div>

      <ol className="flex items-start overflow-x-auto pb-1">
        {preview.steps.map((step, index) => {
          const reached = index <= preview.currentIndex;
          const current = index === preview.currentIndex && !preview.exception;
          const last = index === preview.steps.length - 1;
          return (
            <li
              key={step.status}
              className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full items-center">
                <span
                  className={clsx(
                    "h-0.5 flex-1",
                    index === 0
                      ? "bg-transparent"
                      : reached
                        ? "bg-primary"
                        : "bg-muted",
                  )}
                  aria-hidden
                />
                <span
                  className={clsx(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-200",
                    reached
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-muted text-muted-foreground",
                    current && "ring-2 ring-primary/30 ring-offset-2",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {reached ? <Check size={14} aria-hidden /> : index + 1}
                </span>
                <span
                  className={clsx(
                    "h-0.5 flex-1",
                    last
                      ? "bg-transparent"
                      : index < preview.currentIndex
                        ? "bg-primary"
                        : "bg-muted",
                  )}
                  aria-hidden
                />
              </div>
              <span
                className={clsx(
                  "text-center text-xs font-bold uppercase tracking-wider",
                  reached ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {preview.exception ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm text-orange-900"
        >
          <CircleAlert className="mt-0.5 shrink-0" size={16} aria-hidden />
          <p>{exceptionCopy}</p>
        </div>
      ) : null}

      {preview.events.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Updates
          </h3>
          <ol className="space-y-3 border-l border-border pl-4">
            {preview.events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      "rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                      statusColor(event.status),
                    )}
                  >
                    {event.label}
                  </span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={event.createdAt}
                  >
                    {formatWhen(event.createdAt)}
                  </time>
                </div>
                {event.remarks ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.remarks}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {shipments.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Shipments
          </h3>
          <div className="space-y-3">
            {shipments.map((shipment) => {
              const latest =
                shipment.trackingEvents[shipment.trackingEvents.length - 1];

              return (
                <div
                  key={shipment.id}
                  className="rounded-xl border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PackageCheck
                        size={16}
                        className="text-primary"
                        aria-hidden
                      />
                      <p className="font-mono text-sm font-bold text-foreground">
                        {shipment.shipmentNumber}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                        statusColor(shipment.status),
                      )}
                    >
                      {SHIPMENT_STATUS_LABELS[shipment.status] ??
                        shipment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {shipment.courierProvider}
                    {shipment.trackingNumber
                      ? ` · Tracking ${shipment.trackingNumber}`
                      : ""}
                  </p>
                  {latest ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {SHIPMENT_STATUS_LABELS[latest.status] ?? latest.status}
                      {latest.description ? ` - ${latest.description}` : ""}
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatTrackingDate(latest.eventTime)}
                      </span>
                    </p>
                  ) : null}
                  <Link
                    href={`/track?number=${encodeURIComponent(shipment.shipmentNumber)}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    View tracking
                    <ExternalLink size={12} aria-hidden />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
};

"use client";

import { statusColor } from "@/helpers";
import {
  toOrderStatusPreview,
  type OrderStatusHistoryEntry,
} from "@/features/dashboard/customer/orders/utils/status-preview";
import clsx from "clsx";
import { Check, CircleAlert } from "lucide-react";

const EXCEPTION_COPY: Record<string, string> = {
  CANCELLED: "This order was cancelled and will not continue through delivery.",
  RETURN_REQUESTED: "A return has been requested. We will review it shortly.",
  RETURNED: "This order was returned.",
  REFUNDED: "This order was refunded.",
};

type OrderStatusPreviewProps = {
  status: string;
  history?: OrderStatusHistoryEntry[];
};

const formatWhen = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const OrderStatusPreview = ({
  status,
  history = [],
}: OrderStatusPreviewProps) => {
  const preview = toOrderStatusPreview(status, history);
  const currentStep = preview.steps[preview.currentIndex];
  const exceptionCopy = preview.exception
    ? EXCEPTION_COPY[preview.exception]
    : null;

  return (
    <section
      className="print:hidden space-y-6 rounded-2xl border border-slate-100 bg-white p-4 sm:p-6"
      aria-label="Order status"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-slate-900">Order status</h2>
        <p className="text-sm text-slate-600">
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
                        : "bg-slate-200",
                  )}
                  aria-hidden
                />
                <span
                  className={clsx(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-200",
                    reached
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-slate-50 text-slate-400",
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
                        : "bg-slate-200",
                  )}
                  aria-hidden
                />
              </div>
              <span
                className={clsx(
                  "text-center text-[10px] font-bold uppercase tracking-wider",
                  reached ? "text-slate-900" : "text-slate-400",
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
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Updates
          </h3>
          <ol className="space-y-3 border-l border-slate-200 pl-4">
            {preview.events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      statusColor(event.status),
                    )}
                  >
                    {event.label}
                  </span>
                  <time
                    className="text-xs text-slate-500"
                    dateTime={event.createdAt}
                  >
                    {formatWhen(event.createdAt)}
                  </time>
                </div>
                {event.remarks ? (
                  <p className="mt-1 text-xs text-slate-600">{event.remarks}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
};

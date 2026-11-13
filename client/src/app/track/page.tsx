import type { Metadata } from "next";

import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/status-badge";

import {
  fetchTrackedShipment,
  formatTrackingDate,
  SHIPMENT_STATUS_LABELS,
  type TrackedShipment,
} from "@/features/tracking/api/tracking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track a shipment with your shipment number.",
  robots: { index: false, follow: false },
};

function statusVariant(status: string): StatusBadgeVariant {
  if (status === "DELIVERED") return "success";
  if (status === "CANCELLED" || status === "FAILED" || status === "RETURNED") {
    return "danger";
  }
  return "info";
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.number;
  const shipmentNumber = Array.isArray(raw) ? raw[0] : raw;

  let shipment: TrackedShipment | null = null;
  let error: string | null = null;

  if (shipmentNumber?.trim()) {
    try {
      shipment = await fetchTrackedShipment(shipmentNumber.trim());
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Could not find this shipment";
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Track shipment</h1>
        <p className="text-sm text-muted-foreground">
          Enter the shipment number from your confirmation to see its latest
          status.
        </p>
      </div>

      <form action="/track" method="get" className="flex flex-col gap-2 sm:flex-row">
        <input
          name="number"
          defaultValue={shipmentNumber ?? ""}
          placeholder="SHP-XXXXXX-XXXXXX"
          aria-label="Shipment number"
          className="h-10 flex-1 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Track
        </button>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
        </div>
      ) : null}

      {shipment ? (
        <div className="space-y-5 rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Shipment</p>
              <p className="text-lg font-semibold">{shipment.shipmentNumber}</p>
            </div>
            <StatusBadge variant={statusVariant(shipment.status)}>
              {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
            </StatusBadge>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Courier</dt>
              <dd>{shipment.courierProvider}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tracking number</dt>
              <dd>{shipment.trackingNumber ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Shipped</dt>
              <dd>{formatTrackingDate(shipment.shippedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivered</dt>
              <dd>{formatTrackingDate(shipment.deliveredAt)}</dd>
            </div>
          </dl>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Timeline</h2>
            {shipment.trackingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tracking events yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {[...shipment.trackingEvents].reverse().map((event, index) => (
                  <li key={`${event.eventTime}-${index}`} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {SHIPMENT_STATUS_LABELS[event.status] ?? event.status}
                      </p>
                      {event.description ? (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {formatTrackingDate(event.eventTime)}
                        {event.location ? ` - ${event.location}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

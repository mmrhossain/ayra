import { ShippingTable } from "@/features/dashboard/admin/shipping/components/shipping-table";
import {
  fetchShippingMethods,
  fetchShippingRates,
  fetchShippingZones,
  toShippingErrorMessage,
} from "@/features/shipping/shipping-api";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  let zones;
  let methods;
  let rates;
  let error: string | null = null;

  try {
    [zones, methods, rates] = await Promise.all([
      fetchShippingZones(),
      fetchShippingMethods(),
      fetchShippingRates(),
    ]);
  } catch (err) {
    error = toShippingErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shipping</h1>
        <p className="text-sm text-muted-foreground">
          Zones, delivery methods, and rates used at checkout.
        </p>
      </div>
      {error || !zones || !methods || !rates ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load shipping</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <ShippingTable
          initialZones={zones}
          initialMethods={methods}
          initialRates={rates}
        />
      )}
    </section>
  );
}

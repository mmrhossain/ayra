import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ShippingTable } from "@/features/dashboard/admin/shipping/components/shipping-table";
import {
  fetchShippingMethods,
  fetchShippingRates,
  fetchShippingZones,
  toShippingErrorMessage,
} from "@/features/shipping/shipping-api";

import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  await requireAdminPageAccess("/admin/shipping");
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
      <PageHeader
        title="Shipping settings"
        description="Zones, delivery methods, and rates used at checkout."
      />
      {error || !zones || !methods || !rates ? (
        <PageError
          title="Could not load shipping"
          message={error ?? "Unknown error"}
        />
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

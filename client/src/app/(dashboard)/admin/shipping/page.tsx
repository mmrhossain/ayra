import { fetchShippingZones, fetchShippingMethods, fetchShippingRates } from "@/features/dashboard/admin/shipping/api/shipping";
import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { ShippingTable } from "@/features/dashboard/admin/shipping/components/shipping-table";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  await requireAdminPageAccess("/admin/shipping");
  const [initialZones, initialMethods, initialRates] = await Promise.all([fetchShippingZones(), fetchShippingMethods(), fetchShippingRates()]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Shipping settings"
        description="Zones, delivery methods, and rates used at checkout."
      />
      <ShippingTable initialZones={initialZones} initialMethods={initialMethods} initialRates={initialRates} />
    </section>
  );
}

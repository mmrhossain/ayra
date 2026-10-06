import { AddressPage } from "@/features/dashboard/customer/address/components/address-page";
import {
  fetchMyAddresses,
  toAddressError,
} from "@/features/dashboard/customer/address/api/addresses";

export const dynamic = "force-dynamic";

export default async function CustomerAddressPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchMyAddresses();
  } catch (err) {
    error = toAddressError(err);
  }

  if (error || !initial) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="text-lg font-semibold">Could not load addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return <AddressPage initialData={initial} />;
}

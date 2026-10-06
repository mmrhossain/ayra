import { AccountCard } from "@/features/dashboard/customer/account/components/account-card";
import {
  fetchCustomerProfile,
  toProfileError,
} from "@/features/dashboard/customer/account/api/profile";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchCustomerProfile();
  } catch (err) {
    error = toProfileError(err);
  }

  if (error || !initial) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="text-lg font-semibold">Could not load account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return <AccountCard initialData={initial} />;
}

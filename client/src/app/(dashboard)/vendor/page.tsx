import {
  fetchVendorProfile,
  toProfileError,
} from "@/features/dashboard/vendor/profile/api/profile";
import { VendorDashboard } from "@/features/auth/components/VendorDashboard";
import { requireRole } from "@/lib/api/auth/server";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const session = await requireRole("VENDOR");
  let profile;
  let error: string | null = null;

  try {
    profile = await fetchVendorProfile();
  } catch (err) {
    error = toProfileError(err);
  }

  return (
    <section className="space-y-6">
      {error || !profile ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">
            Could not load vendor dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      ) : (
        <VendorDashboard
          profile={profile}
          accountName={session.user?.name}
          accountEmail={session.user?.email}
        />
      )}
    </section>
  );
}

import VendorProfileForm from "@/features/auth/components/VendorProfileForm";
import {
  fetchVendorProfile,
  toProfileError,
} from "@/features/dashboard/vendor/profile/api/profile";

export const dynamic = "force-dynamic";

export default async function VendorProfilePage() {
  let profile;
  let error: string | null = null;

  try {
    profile = await fetchVendorProfile();
  } catch (err) {
    error = toProfileError(err);
  }

  if (error || !profile) {
    return (
      <section className="space-y-6">
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load shop profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
      </section>
    );
  }

  return <VendorProfileForm initialProfile={profile} />;
}

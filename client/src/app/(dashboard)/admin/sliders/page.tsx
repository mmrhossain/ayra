import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchSliderList,
  toSliderErrorMessage,
} from "@/features/dashboard/admin/sliders/api/slider";
import { SliderTable } from "@/features/dashboard/admin/sliders/components/slider-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminSlidersPage() {
  await requireAdminPageAccess("/admin/sliders");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchSliderList({ page: 1, limit: 20 });
  } catch (err) {
    error = toSliderErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Sliders" />
      {error || !initial ? (
        <PageError
          title="Could not load sliders"
          message={error ?? "Unknown error"}
        />
      ) : (
        <SliderTable initialData={initial} />
      )}
    </section>
  );
}

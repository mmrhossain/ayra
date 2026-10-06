import {
  fetchSliderList,
  toSliderErrorMessage,
} from "@/features/dashboard/admin/sliders/api/slider";
import { SliderTable } from "@/features/dashboard/admin/sliders/components/slider-table";

export const dynamic = "force-dynamic";

export default async function AdminSlidersPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchSliderList({ page: 1, limit: 20 });
  } catch (err) {
    error = toSliderErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sliders</h1>
      </div>
      {error || !initial ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold">Could not load sliders</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        </div>
      ) : (
        <SliderTable initialData={initial} />
      )}
    </section>
  );
}

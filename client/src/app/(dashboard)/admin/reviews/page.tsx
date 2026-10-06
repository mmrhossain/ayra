import {
  fetchAdminReviewList,
  toReviewErrorMessage,
} from "@/features/dashboard/admin/reviews/api/reviews";
import { ReviewTable } from "@/features/dashboard/admin/reviews/components/review-table";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminReviewList({ page: 1, limit: 20 });
  } catch (err) {
    error = toReviewErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        {/* <p className="text-sm text-muted-foreground">
          Moderate product reviews from the live backend.
        </p> */}
      </div>
      {error || !initial ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold">Could not load reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
        </div>
      ) : (
        <ReviewTable initialData={initial} />
      )}
    </section>
  );
}

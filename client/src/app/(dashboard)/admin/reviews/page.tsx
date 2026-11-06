import { requireAdminPageAccess } from "@/lib/api/auth/server";
import {
  fetchAdminReviewList,
  toReviewErrorMessage,
} from "@/features/dashboard/admin/reviews/api/reviews";
import { ReviewTable } from "@/features/dashboard/admin/reviews/components/review-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireAdminPageAccess("/admin/reviews");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminReviewList({ page: 1, limit: 20 });
  } catch (err) {
    error = toReviewErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Reviews" />
      {error || !initial ? (
        <PageError
          title="Could not load reviews"
          message={error ?? "Unknown error"}
        />
      ) : (
        <ReviewTable initialData={initial} />
      )}
    </section>
  );
}

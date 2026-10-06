import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AdminReviewItem,
  Envelope,
  ReviewListParams,
  ReviewListResult,
} from "@/features/dashboard/admin/reviews/types";

export type {
  AdminReviewItem,
  Envelope,
  ReviewListParams,
  ReviewListResult,
  ReviewPagination,
  ReviewStatusFilter,
} from "@/features/dashboard/admin/reviews/types";

export {
  commentSnippet,
  isReviewRejected,
  reviewCustomerLabel,
  reviewStatusLabel,
  toReviewErrorMessage,
} from "@/features/dashboard/admin/reviews/utils";

const noStore = { cache: "no-store" as const };

export async function fetchAdminReviewList(
  params: ReviewListParams = {},
): Promise<ReviewListResult> {
  const res = await dashboardApi.get<Envelope<ReviewListResult>>(
    "/admin/reviews",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
      },
    },
  );
  return res.data;
}

export async function approveReview(id: string): Promise<AdminReviewItem> {
  const res = await dashboardApi.patch<Envelope<AdminReviewItem>>(
    `/admin/reviews/${id}/approve`,
  );
  return res.data;
}

export async function rejectReview(
  id: string,
  rejectionReason?: string,
): Promise<AdminReviewItem> {
  const res = await dashboardApi.patch<Envelope<AdminReviewItem>>(
    `/admin/reviews/${id}/reject`,
    {
      body: rejectionReason?.trim()
        ? { rejectionReason: rejectionReason.trim() }
        : {},
    },
  );
  return res.data;
}

export async function deleteReview(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/reviews/${id}`);
}

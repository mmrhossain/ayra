/**
 * Authenticated customer review submit. Dashboard client only.
 * Public review GET lives in `@/features/catalog/api`.
 */
import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";

type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export async function submitProductReview(
  productId: string,
  body: { rating: number; comment?: string },
): Promise<{ message: string }> {
  const res = await dashboardApi.post<Envelope<unknown>>(
    `/products/${productId}/reviews`,
    { body },
  );
  return { message: res.message || "Review submitted for approval" };
}

export function toProductReviewError(err: unknown): string {
  if (err instanceof DashboardApiError) {
    if (err.status === 401) return "Please sign in to write a review";
    if (err.status === 409) return "You've already reviewed this product";
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

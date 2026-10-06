/**
 * @deprecated Public review GET is in `@/features/catalog/api`.
 * Customer review submit is in `@/features/dashboard/customer/reviews/api/reviews`.
 */
export {
  fetchProductReviews,
  reviewDisplayName,
  type ProductReview,
  type ProductReviewListResult,
  type ProductReviewPagination,
} from "@/features/catalog/api";
export {
  submitProductReview,
  toProductReviewError,
} from "@/features/dashboard/customer/reviews/api/reviews";

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  sortLabel,
  useProductReviews,
  type SortKey,
} from "@/features/reviews/hooks/use-product-reviews";
import { formatLongDate } from "@/lib/format";
import { Rating, Star } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";
import { BadgeCheck, ChevronDown, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const starStyles = {
  itemShapes: Star,
  activeFillColor: "#ffb400",
  inactiveFillColor: "#e5e7eb",
};

const ReviewTab = ({
  productId,
  reviewCount,
}: {
  productId: string;
  averageRating?: number | null;
  reviewCount?: number | null;
}) => {
  const {
    isLoggedIn,
    form,
    formNotice,
    writeOpen,
    setWriteOpen,
    sort,
    setSort,
    loading,
    loadingMore,
    hasMore,
    page,
    loadReviews,
    onSubmit,
    sortedReviews,
    reviewDisplayName,
  } = useProductReviews(productId);

  const count = Number(reviewCount) || 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 md:mb-8">
        <h2 className="text-base font-bold text-secondary sm:text-lg md:text-xl">
          All Reviews
          <span className="ml-1.5 text-sm font-normal text-sky-color sm:text-base">({count})</span>
        </h2>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Sort reviews"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-bg-primary text-secondary transition-colors hover:bg-border-color sm:hidden"
              >
                <SlidersHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] sm:hidden">
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => setSort(value as SortKey)}
              >
                <DropdownMenuRadioItem value="latest">Latest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="highest">Highest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lowest">Lowest</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hidden h-10 min-w-[108px] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-bg-primary px-4 text-sm font-medium text-secondary transition-colors hover:bg-border-color sm:inline-flex sm:h-11"
              >
                {sortLabel(sort)}
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => setSort(value as SortKey)}
              >
                <DropdownMenuRadioItem value="latest">Latest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="highest">Highest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lowest">Lowest</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setWriteOpen(true)}
            className="h-10 cursor-pointer rounded-full bg-secondary px-4 text-sm font-medium text-white transition-colors hover:bg-primary sm:h-11 sm:px-5"
          >
            Write a Review
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-sky-color">Loading reviews...</p>
      ) : sortedReviews.length === 0 ? (
        <p className="text-sm text-sky-color">
          No reviews yet. Be the first to review this product.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:gap-5">
          {sortedReviews.map((review) => (
            <article
              key={review.id}
              className="flex flex-col rounded-2xl border border-border-color p-4 sm:rounded-[20px] sm:p-5 md:p-6"
            >
              <Rating
                value={review.rating}
                readOnly
                style={{ maxWidth: 108 }}
                itemStyles={starStyles}
              />
              <h3 className="mt-3 flex items-center gap-1.5 text-base font-bold text-secondary sm:text-lg">
                {reviewDisplayName(review)}
                {review.verifiedPurchase ? (
                  <BadgeCheck
                    size={18}
                    className="shrink-0 fill-[#01AB31] text-white"
                    aria-label="Verified purchase"
                  />
                ) : null}
              </h3>
              {review.comment ? (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-sky-color sm:text-[15px]">
                  &ldquo;{review.comment}&rdquo;
                </p>
              ) : null}
              <p className="mt-4 text-xs font-medium text-sky-color sm:text-sm">
                Posted on {formatLongDate(review.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center sm:mt-8">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => void loadReviews(page + 1, true)}
            className="h-11 min-w-[200px] cursor-pointer rounded-full border border-border-color bg-white px-8 text-sm font-medium text-secondary transition-colors hover:bg-bg-primary disabled:opacity-60 sm:h-12"
          >
            {loadingMore ? "Loading..." : "Load More Reviews"}
          </button>
        </div>
      )}

      <Dialog open={writeOpen} onOpenChange={setWriteOpen} modal={false}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-[calc(100%-2rem)] rounded-sm sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-secondary">Write a Review</DialogTitle>
          </DialogHeader>

          {!isLoggedIn ? (
            <p className="text-sm text-sky-color">
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login to write a review
              </Link>
            </p>
          ) : formNotice === "pending" ? (
            <p className="text-sm text-sky-color">
              Review submitted, pending approval. It will appear after admin approval.
            </p>
          ) : formNotice === "duplicate" ? (
            <p className="text-sm text-sky-color">You&apos;ve already reviewed this product.</p>
          ) : (
            <Form {...form}>
              <form className="space-y-5" onSubmit={onSubmit}>
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Rating
                          value={field.value}
                          onChange={field.onChange}
                          style={{ maxWidth: 140 }}
                          itemStyles={starStyles}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-danger" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder="Share your thoughts about this product..."
                          className="w-full resize-none rounded-xl border border-border-color bg-white p-4 focus:border-primary focus:outline-none focus-visible:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-danger" />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="h-11 w-full cursor-pointer rounded-full bg-secondary text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-70"
                >
                  {form.formState.isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewTab;

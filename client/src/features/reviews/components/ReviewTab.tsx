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
import { BadgeCheck, ChevronDown, MessageSquare, PenLine } from "lucide-react";
import Link from "next/link";

const starStyles = {
  itemShapes: Star,
  activeFillColor: "#ffb400",
  inactiveFillColor: "#e5e7eb",
};

const ReviewTab = ({
  productId,
  averageRating,
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
    loadError,
    retryReviews,
    loadingMore,
    hasMore,
    loadMore,
    onSubmit,
    sortedReviews,
    reviewDisplayName,
  } = useProductReviews(productId);

  const count = Number(reviewCount) || 0;

  return (
    <section aria-label="Customer reviews" className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:p-6 lg:flex-col lg:items-stretch">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Customer reviews</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground lg:items-start">
            {count > 0 && averageRating != null && (
              <>
                <span className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{Number(averageRating).toFixed(1)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 5</span></span>
                <div className="self-center"><Rating value={Number(averageRating)} readOnly style={{ width: 84 }} itemStyles={starStyles} /></div>
              </>
            )}
            <span className="basis-full">{count === 1 ? "1 review" : `${count.toLocaleString()} reviews`}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWriteOpen(true)}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-primary"
        >
          <PenLine size={15} aria-hidden="true" />
          Write a review
        </button>
      </header>

      <div className="min-w-0">
        {sortedReviews.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Showing {sortedReviews.length}{count > sortedReviews.length ? ` of ${count.toLocaleString()}` : ""}</p>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Sort reviews, ${sortLabel(sort)}`}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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

          </div>
        )}

        {loading ? (
          <div role="status" className="space-y-3 rounded-xl border border-border p-5">
            <span className="sr-only">Loading reviews</span>
            <div aria-hidden="true" className="h-4 w-28 rounded bg-muted motion-safe:animate-pulse" />
            <div aria-hidden="true" className="h-4 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-xl border border-border px-4 py-9 text-center">
            <p className="font-medium text-foreground">Couldn&apos;t load reviews</p>
            <button type="button" onClick={retryReviews} className="mt-2 cursor-pointer text-sm font-medium text-primary underline underline-offset-4">Try again</button>
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-9 text-center">
            <MessageSquare size={22} className="mx-auto text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 font-medium text-foreground">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to review this product.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {sortedReviews.map((review) => {
              const name = reviewDisplayName(review);
              const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("");

              return (
                <li key={review.id} className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground sm:size-10">
                    {initials}
                  </span>
                  <article className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-foreground sm:text-base">{name}</h3>
                      <time dateTime={review.createdAt} className="text-xs text-muted-foreground sm:text-sm">
                        {formatLongDate(review.createdAt)}
                      </time>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Rating value={review.rating} readOnly style={{ width: 84 }} itemStyles={starStyles} />
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <BadgeCheck size={14} aria-hidden="true" />
                          Verified purchase
                        </span>
                      )}
                    </div>
                    {review.comment && (
                      <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground sm:text-base">
                        {review.comment}
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center sm:mt-8">
            <button
              type="button"
              disabled={loadingMore}
              onClick={loadMore}
              className="h-11 min-w-[200px] cursor-pointer rounded-full border border-border-color bg-white px-8 text-sm font-medium text-foreground transition-colors hover:bg-bg-primary disabled:opacity-60 sm:h-12"
            >
              {loadingMore ? "Loading..." : "Load More Reviews"}
            </button>
          </div>
        )}
      </div>

      <Dialog open={writeOpen} onOpenChange={setWriteOpen} modal={false}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-[calc(100%-2rem)] rounded-sm sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Write a Review</DialogTitle>
          </DialogHeader>

          {!isLoggedIn ? (
            <p className="text-sm text-foreground">
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login to write a review
              </Link>
            </p>
          ) : formNotice === "pending" ? (
            <p className="text-sm text-foreground">
              Review submitted, pending approval. It will appear after admin approval.
            </p>
          ) : formNotice === "duplicate" ? (
            <p className="text-sm text-foreground">You&apos;ve already reviewed this product.</p>
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
                      <FormMessage className="text-danger" />
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
                      <FormMessage className="text-danger" />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="h-11 w-full cursor-pointer rounded-full bg-ink text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-70"
                >
                  {form.formState.isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ReviewTab;

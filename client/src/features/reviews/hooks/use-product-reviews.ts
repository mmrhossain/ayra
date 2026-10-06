"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { fetchProductReviews, reviewDisplayName, type ProductReview } from "@/features/catalog/api";
import {
  submitProductReview,
  toProductReviewError,
} from "@/features/dashboard/customer/reviews/api/reviews";
import { reviewSchema, type ReviewFormData } from "@/features/reviews/schemas/reviewSchema";
import { errorToast, successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import { DashboardApiError } from "@/lib/api/dashboard";

const PAGE_SIZE = 6;

export type SortKey = "latest" | "oldest" | "highest" | "lowest";

export function useProductReviews(productId: string) {
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formNotice, setFormNotice] = useState<"idle" | "pending" | "duplicate">("idle");
  const [writeOpen, setWriteOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("latest");

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: "" },
  });

  const loadReviews = async (nextPage: number, append = false) => {
    if (!productId) return;

    try {
      const result = await fetchProductReviews(productId, nextPage, PAGE_SIZE);

      setReviews((prev) => {
        if (!append) return result.items;

        const existingIds = new Set(prev.map((r) => r.id));
        const uniqueNewItems = result.items.filter((r) => !existingIds.has(r.id));
        return [...prev, ...uniqueNewItems];
      });

      setPage(result.pagination.page);
      setTotalPages(Math.max(1, result.pagination.totalPages));
      setFormNotice("idle");
    } catch (err) {
      errorToast(toProductReviewError(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      setLoadingMore(true);
      void loadReviews(page + 1, true);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initFetch() {
      if (!productId || ignore) return;
      await loadReviews(1, false);
    }

    void initFetch();

    return () => {
      ignore = true;
    };
  }, [productId]);

  const onSubmit = form.handleSubmit(async (data: ReviewFormData) => {
    try {
      await submitProductReview(productId, {
        rating: data.rating,
        comment: data.comment?.trim() || undefined,
      });

      successToast("Review submitted, pending approval. It will appear after admin approval.");
      form.reset({ rating: 5, comment: "" });
      setFormNotice("pending");
      setWriteOpen(false);
    } catch (err) {
      const message = toProductReviewError(err);
      errorToast(message);

      const isDuplicate =
        (err instanceof DashboardApiError && err.status === 409) ||
        message.toLowerCase().includes("already reviewed");

      if (isDuplicate) {
        setFormNotice("duplicate");
      }
    }
  });

  const hasMore = page < totalPages;

  let sortedReviews: ProductReview[] = [];
  if (reviews.length > 0) {
    const list = [...reviews];

    if (sort === "highest") {
      sortedReviews = list.sort((a, b) => b.rating - a.rating);
    } else if (sort === "lowest") {
      sortedReviews = list.sort((a, b) => a.rating - b.rating);
    } else {
      sortedReviews = list.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sort === "oldest" ? aTime - bTime : bTime - aTime;
      });
    }
  }

  return {
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
    loadMore: handleLoadMore,
    loadReviews,
    onSubmit,
    sortedReviews,
    reviewDisplayName,
  };
}

export function sortLabel(sort: SortKey): string {
  switch (sort) {
    case "oldest":
      return "Oldest";
    case "highest":
      return "Highest";
    case "lowest":
      return "Lowest";
    case "latest":
    default:
      return "Latest";
  }
}

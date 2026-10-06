"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createFaqCategory,
  createFaqItem,
  deleteFaqCategory,
  deleteFaqItem,
  updateFaqCategory,
  updateFaqItem,
} from "@/features/dashboard/admin/faqs/api/faqs";
import type {
  FaqCategoryFormValues,
  FaqItemFormValues,
} from "@/features/dashboard/admin/faqs/schemas";
import type {
  DialogMode,
  FaqCategoryListItem,
  FaqItemListItem,
} from "@/features/dashboard/admin/faqs/types";
import {
  toFaqCategoryDeleteErrorMessage,
  toFaqErrorMessage,
} from "@/features/dashboard/admin/faqs/utils";

export function useFaqCategoryFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: FaqCategoryListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: FaqCategoryFormValues) => {
      const body = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing category");
        return updateFaqCategory(initialData.id, body);
      }
      return createFaqCategory(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq-categories"] });
      toast.success(mode === "edit" ? "Category updated" : "Category created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toFaqErrorMessage(err));
    },
  });
}

export function useFaqCategoryDeleteMutation({
  category,
  onSuccess,
}: {
  category: FaqCategoryListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Missing category");
      await deleteFaqCategory(category.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-faq-items"] });
      toast.success("Category deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toFaqCategoryDeleteErrorMessage(err));
    },
  });
}

export function useFaqItemFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: FaqItemListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: FaqItemFormValues) => {
      const body = {
        categoryId: values.categoryId,
        question: values.question.trim(),
        answer: values.answer.trim(),
        sortOrder: values.sortOrder,
        isPublished: values.isPublished,
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing item");
        return updateFaqItem(initialData.id, body);
      }
      return createFaqItem(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq-items"] });
      queryClient.invalidateQueries({ queryKey: ["admin-faq-categories"] });
      toast.success(mode === "edit" ? "FAQ updated" : "FAQ created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toFaqErrorMessage(err));
    },
  });
}

export function useFaqItemDeleteMutation({
  item,
  onSuccess,
}: {
  item: FaqItemListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("Missing item");
      await deleteFaqItem(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq-items"] });
      queryClient.invalidateQueries({ queryKey: ["admin-faq-categories"] });
      toast.success("FAQ deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toFaqErrorMessage(err));
    },
  });
}

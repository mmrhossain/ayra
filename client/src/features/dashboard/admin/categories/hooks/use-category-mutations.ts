"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/dashboard/admin/categories/api/categories";
import type { CategoryFormValues } from "@/features/dashboard/admin/categories/schemas";
import type {
  CategoryListItem,
  DialogMode,
} from "@/features/dashboard/admin/categories/types";
import {
  toCategoryDeleteErrorMessage,
  toCategoryErrorMessage,
} from "@/features/dashboard/admin/categories/utils";

export function useCategoryFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: CategoryListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const body = {
        name: values.name,
        description: values.description || undefined,
        isActive: values.isActive,
        parentId: values.parentId ? values.parentId : null,
        image: values.image || undefined,
        imagePublicId: values.imagePublicId || undefined,
      };

      if (mode === "create") {
        await createCategory(body);
        return;
      }

      if (!initialData?.id) {
        throw new Error("Missing category id");
      }

      await updateCategory(initialData.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-categories"],
      });
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      toast.success(mode === "create" ? "Category created" : "Category updated");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toCategoryErrorMessage(err));
    },
  });
}

export function useCategoryDeleteMutation({
  category,
  onSuccess,
}: {
  category: CategoryListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Missing category");
      await deleteCategory(category.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toCategoryDeleteErrorMessage(err));
    },
  });
}

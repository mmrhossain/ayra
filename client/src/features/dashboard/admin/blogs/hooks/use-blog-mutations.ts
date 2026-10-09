"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createBlog,
  createBlogCategory,
  deleteBlog,
  deleteBlogCategory,
  publishBlog,
  updateBlog,
  updateBlogCategory,
} from "@/features/dashboard/admin/blogs/api/blogs";
import type {
  BlogCategoryFormValues,
  BlogFormValues,
} from "@/features/dashboard/admin/blogs/schemas";
import type {
  BlogCategoryListItem,
  BlogListItem,
  DialogMode,
} from "@/features/dashboard/admin/blogs/types";
import {
  toBlogCategoryDeleteErrorMessage,
  toBlogErrorMessage,
} from "@/features/dashboard/admin/blogs/utils";

export function useBlogCategoryFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: BlogCategoryListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BlogCategoryFormValues) => {
      const body = {
        name: values.name.trim(),
        slug: values.slug.trim(),
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing category");
        return updateBlogCategory(initialData.id, body);
      }
      return createBlogCategory(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast.success(mode === "edit" ? "Category updated" : "Category created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toBlogErrorMessage(err));
    },
  });
}

export function useBlogCategoryDeleteMutation({
  category,
  onSuccess,
}: {
  category: BlogCategoryListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Missing category");
      await deleteBlogCategory(category.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Category deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toBlogCategoryDeleteErrorMessage(err));
    },
  });
}

export function useBlogFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: BlogListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BlogFormValues) => {
      const body = {
        title: values.title.trim(),
        slug: values.slug.trim(),
        excerpt: values.excerpt?.trim() || undefined,
        content: values.content.trim(),
        featuredImage: values.featuredImage?.trim() || undefined,
        featuredImagePublicId: values.featuredImagePublicId?.trim()
          ? values.featuredImagePublicId.trim()
          : undefined,
        categoryId: values.categoryId ? values.categoryId : null,
        metaTitle: values.metaTitle?.trim() || undefined,
        metaDescription: values.metaDescription?.trim() || undefined,
        metaKeywords: values.metaKeywords?.trim() || undefined,
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing post");
        return updateBlog(initialData.id, {
          ...body,
          excerpt: values.excerpt?.trim() ? values.excerpt.trim() : null,
          featuredImage: values.featuredImage?.trim() ? values.featuredImage.trim() : null,
          featuredImagePublicId: values.featuredImagePublicId?.trim()
            ? values.featuredImagePublicId.trim()
            : null,
          metaTitle: values.metaTitle?.trim() ? values.metaTitle.trim() : null,
          metaDescription: values.metaDescription?.trim()
            ? values.metaDescription.trim()
            : null,
          metaKeywords: values.metaKeywords?.trim() ? values.metaKeywords.trim() : null,
        });
      }
      return createBlog(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast.success(mode === "edit" ? "Post updated" : "Draft created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toBlogErrorMessage(err));
    },
  });
}

export function useBlogPublishMutation({
  post,
  onSuccess,
}: {
  post: BlogListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!post) throw new Error("Missing post");
      await publishBlog(post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Post published");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toBlogErrorMessage(err));
    },
  });
}

export function useBlogDeleteMutation({
  post,
  onSuccess,
}: {
  post: BlogListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!post) throw new Error("Missing post");
      await deleteBlog(post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast.success("Post deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toBlogErrorMessage(err));
    },
  });
}

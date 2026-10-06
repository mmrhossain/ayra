"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBlogCategoryFormMutation } from "@/features/dashboard/admin/blogs/hooks/use-blog-mutations";
import {
  blogCategoryFormSchema,
  type BlogCategoryFormValues,
} from "@/features/dashboard/admin/blogs/schemas";
import type { BlogCategoryFormDialogProps } from "@/features/dashboard/admin/blogs/types";
import { blogCategoryFormDefaults, slugify } from "@/features/dashboard/admin/blogs/utils";

const BLOG_CATEGORY_FORM_ID = "blog-category-form";

export type { BlogCategoryFormDialogProps };

export function BlogCategoryDialog({
  open,
  onOpenChange,
  mode,
  initialData,
}: BlogCategoryFormDialogProps) {
  const form = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: blogCategoryFormDefaults(initialData),
  });

  const mutation = useBlogCategoryFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  const onSubmit = (values: BlogCategoryFormValues) => {
    const payload = {
      ...values,
      slug: slugify(values.name),
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit blog category" : "Add blog category"}</DialogTitle>
          <DialogDescription>Categories group published posts on the storefront.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={BLOG_CATEGORY_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder="Guides"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form={BLOG_CATEGORY_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

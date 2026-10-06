"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategoryFormMutation } from "@/features/dashboard/admin/categories/hooks/use-category-mutations";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/features/dashboard/admin/categories/schemas";
import type { CategoryFormDialogProps } from "@/features/dashboard/admin/categories/types";
import {
  categoryFormDefaults,
  parentCategoryOptions,
} from "@/features/dashboard/admin/categories/utils";
import { ImageUpload } from "@/features/dashboard/admin/shared/components/image-upload";

const CATEGORY_FORM_ID = "category-form";

export type { CategoryFormDialogProps };

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  categories,
}: CategoryFormDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: categoryFormDefaults(initialData),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(categoryFormDefaults(initialData));
  }, [open, mode, initialData, form]);

  const parentOptions = useMemo(
    () => parentCategoryOptions(categories, initialData?.id),
    [categories, initialData?.id]
  );

  const mutation = useCategoryFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "create" ? "Add Category" : "Edit Category"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a category. Leave parent empty for a root category."
              : "Update category details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={CATEGORY_FORM_ID}
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      mode="single"
                      folder="categories"
                      value={field.value}
                      onChange={(url) => {
                        field.onChange(url);
                        if (!url) {
                          form.setValue("imagePublicId", "");
                        }
                      }}
                      onUploaded={(asset) => {
                        form.setValue("image", asset.url);
                        form.setValue("imagePublicId", asset.publicId);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent category</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    value={field.value ? field.value : "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {parentOptions.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {"— ".repeat(
                            "depth" in cat && typeof cat.depth === "number" ? cat.depth : 0
                          )}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
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
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={CATEGORY_FORM_ID}
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending
              ? "Saving..."
              : mode === "create"
                ? "Create category"
                : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

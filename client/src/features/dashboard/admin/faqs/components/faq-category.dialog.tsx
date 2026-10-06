"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
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
import { useFaqCategoryFormMutation } from "@/features/dashboard/admin/faqs/hooks/use-faq-mutations";
import {
  faqCategoryFormSchema,
  type FaqCategoryFormValues,
} from "@/features/dashboard/admin/faqs/schemas";
import type { FaqCategoryFormDialogProps } from "@/features/dashboard/admin/faqs/types";
import { faqCategoryFormDefaults, slugify } from "@/features/dashboard/admin/faqs/utils";

const FAQ_CATEGORY_FORM_ID = "faq-category-form";

export type { FaqCategoryFormDialogProps };

export function FaqCategoryFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
}: FaqCategoryFormDialogProps) {
  const slugManual = useRef(false);

  const form = useForm<FaqCategoryFormValues>({
    resolver: zodResolver(faqCategoryFormSchema),
    defaultValues: faqCategoryFormDefaults(initialData),
  });

  // Dialog খোলা হলে বা initialData বদলালে Form Reset
  useEffect(() => {
    if (!open) return;
    slugManual.current = mode === "edit";
    form.reset(faqCategoryFormDefaults(initialData));
  }, [open, mode, initialData, form]);

  const mutation = useFaqCategoryFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit FAQ category" : "Add FAQ category"}</DialogTitle>
          <DialogDescription>
            Categories group published questions on the storefront.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={FAQ_CATEGORY_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
                      placeholder="Orders & Shipping"
                      disabled={mutation.isPending}
                      onChange={(e) => {
                        field.onChange(e);
                        // ✅ Event-Driven Slug Update: useEffect এবং extra re-render বন্ধ করে
                        if (!slugManual.current) {
                          form.setValue("slug", slugify(e.target.value), {
                            shouldValidate: false,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder="orders-shipping"
                      disabled={mutation.isPending}
                      onChange={(e) => {
                        slugManual.current = true;
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={Number.isFinite(field.value) ? field.value : 0}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? 0 : e.target.valueAsNumber)
                      }
                      disabled={mutation.isPending}
                    />
                  </FormControl>
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
                      disabled={mutation.isPending}
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
          >
            Cancel
          </Button>
          <Button type="submit" form={FAQ_CATEGORY_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : mode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

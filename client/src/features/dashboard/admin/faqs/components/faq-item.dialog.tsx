"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { useFaqItemFormMutation } from "@/features/dashboard/admin/faqs/hooks/use-faq-mutations";
import { faqItemFormSchema, type FaqItemFormValues } from "@/features/dashboard/admin/faqs/schemas";
import type { FaqItemFormDialogProps } from "@/features/dashboard/admin/faqs/types";

const FAQ_ITEM_FORM_ID = "faq-item-form";

export type { FaqItemFormDialogProps };

export function FaqItemFormDialog({
  open,
  onOpenChange,
  mode,
  categories,
  initialData,
  defaultCategoryId,
}: FaqItemFormDialogProps) {
  const form = useForm<FaqItemFormValues>({
    resolver: zodResolver(faqItemFormSchema),
    defaultValues: {
      categoryId: "",
      question: "",
      answer: "",
      sortOrder: 0,
      isPublished: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      categoryId: initialData?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
      question: initialData?.question ?? "",
      answer: initialData?.answer ?? "",
      sortOrder: initialData?.sortOrder ?? 0,
      isPublished: initialData?.isPublished ?? false,
    });
  }, [open, initialData, defaultCategoryId, categories, form]);

  const mutation = useFaqItemFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          <DialogDescription>Published items appear on the storefront FAQ page.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={FAQ_ITEM_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder="Do you ship internationally?"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      variant="slim"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write the answer"
                      disabled={mutation.isPending}
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
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Published</FormLabel>
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
          <Button type="submit" form={FAQ_ITEM_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : mode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { useAttributeFormMutation } from "@/features/dashboard/admin/attributes/hooks/use-attribute-mutations";
import {
  attributeFormSchema,
  type AttributeFormValues,
} from "@/features/dashboard/admin/attributes/schemas";
import type { AttributeFormDialogProps } from "@/features/dashboard/admin/attributes/types";

const ATTRIBUTE_FORM_ID = "attribute-form";

export type { AttributeFormDialogProps };

export function AttributeFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
}: AttributeFormDialogProps) {
  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: mode === "edit" ? (initialData?.name ?? "") : "" });
  }, [open, mode, initialData, form]);

  const mutation = useAttributeFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit attribute" : "Add attribute"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the attribute name."
              : "Create a product attribute such as Size or Color."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={ATTRIBUTE_FORM_ID}
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
                      placeholder="Size"
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
          <Button type="submit" form={ATTRIBUTE_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save"
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

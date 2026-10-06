"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";

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
import { useShippingMethodFormMutation } from "@/features/dashboard/admin/shipping/hooks/use-shipping-mutations";
import {
  shippingMethodFormSchema,
  type ShippingMethodFormValues,
} from "@/features/dashboard/admin/shipping/schemas";
import type { MethodFormDialogProps } from "@/features/dashboard/admin/shipping/types";
import { emptyMethodValues, fromMethod } from "@/features/dashboard/admin/shipping/utils";

const METHOD_FORM_ID = "shipping-method-form";

export type { MethodFormDialogProps };

export function MethodFormDialog({ open, onOpenChange, mode, initialData }: MethodFormDialogProps) {
  const form = useForm<ShippingMethodFormValues>({
    resolver: zodResolver(shippingMethodFormSchema) as Resolver<ShippingMethodFormValues>,
    defaultValues: emptyMethodValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(mode === "edit" && initialData ? fromMethod(initialData) : emptyMethodValues());
  }, [open, mode, initialData, form]);

  const mutation = useShippingMethodFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit method" : "Add method"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update shipping method details."
              : "Create a delivery method such as Standard or Express."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={METHOD_FORM_ID}
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
                      placeholder="Standard Delivery"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="STANDARD" disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 pt-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">Active</FormLabel>
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
          <Button type="submit" form={METHOD_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : mode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useShippingZoneFormMutation } from "@/features/dashboard/admin/shipping/hooks/use-shipping-mutations";
import {
  shippingZoneFormSchema,
  type ShippingZoneFormValues,
} from "@/features/dashboard/admin/shipping/schemas";
import type { ZoneFormDialogProps } from "@/features/dashboard/admin/shipping/types";
import { emptyZoneValues, fromZone } from "@/features/dashboard/admin/shipping/utils";

const ZONE_FORM_ID = "shipping-zone-form";

export type { ZoneFormDialogProps };

export function ZoneFormDialog({ open, onOpenChange, mode, initialData }: ZoneFormDialogProps) {
  const form = useForm<ShippingZoneFormValues>({
    resolver: zodResolver(shippingZoneFormSchema) as Resolver<ShippingZoneFormValues>,
    defaultValues: emptyZoneValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(mode === "edit" && initialData ? fromZone(initialData) : emptyZoneValues());
  }, [open, mode, initialData, form]);

  const mutation = useShippingZoneFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col overflow-hidden p-4 sm:max-w-lg sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit zone" : "Add zone"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update shipping zone matching rules."
              : "Create a zone used to match delivery districts."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={ZONE_FORM_ID}
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
                    <Input {...field} placeholder="Inside Dhaka" disabled={mutation.isPending} />
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
                    <Input {...field} placeholder="INSIDE_DHAKA" disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="matchDistricts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match districts</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Dhaka, Narayanganj"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFallback"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 pt-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Fallback zone for unmatched districts
                  </FormLabel>
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
          <Button type="submit" form={ZONE_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : mode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

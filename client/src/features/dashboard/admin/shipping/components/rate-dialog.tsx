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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShippingRateFormMutation } from "@/features/dashboard/admin/shipping/hooks/use-shipping-mutations";
import {
  shippingRateFormSchema,
  type ShippingRateFormValues,
} from "@/features/dashboard/admin/shipping/schemas";
import type { RateFormDialogProps } from "@/features/dashboard/admin/shipping/types";
import { emptyRateValues, fromRate } from "@/features/dashboard/admin/shipping/utils";

const RATE_FORM_ID = "shipping-rate-form";

export type { RateFormDialogProps };

export function RateFormDialog({
  open,
  onOpenChange,
  mode,
  zones,
  methods,
  initialData,
}: RateFormDialogProps) {
  const form = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateFormSchema) as Resolver<ShippingRateFormValues>,
    defaultValues: emptyRateValues(),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(mode === "edit" && initialData ? fromRate(initialData) : emptyRateValues());
  }, [open, mode, initialData, form]);

  const mutation = useShippingRateFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-lg flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit rate" : "Add rate"}</DialogTitle>
          <DialogDescription>Set the price for a zone and delivery method.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={RATE_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="shippingZoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={mutation.isPending}>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
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
              name="shippingMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={mutation.isPending}>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {methods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
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
              name="freeShippingFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Free shipping from</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? null : Number(e.target.value))
                      }
                      placeholder="Optional"
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
          <Button type="submit" form={RATE_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : mode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

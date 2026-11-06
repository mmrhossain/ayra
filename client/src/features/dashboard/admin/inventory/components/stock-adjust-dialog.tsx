"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStockAdjustMutation } from "@/features/dashboard/admin/inventory/hooks/use-stock-adjust";
import {
  adjustFormSchema,
  type AdjustFormValues,
} from "@/features/dashboard/admin/inventory/schemas";
import type { StockAdjustDialogProps } from "@/features/dashboard/admin/inventory/types";
import { REASONS } from "@/features/dashboard/admin/inventory/utils";

const ADJUST_FORM_ID = "stock-adjust-form";

export type { StockAdjustDialogProps };

export function StockAdjustDialog({ open, onOpenChange, item }: StockAdjustDialogProps) {
  const form = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustFormSchema) as Resolver<AdjustFormValues>,
    defaultValues: {
      type: "set",
      quantity: "",
      reason: "RESTOCK",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      type: "set",
      quantity: item ? String(item.quantityOnHand) : "",
      reason: "RESTOCK",
      notes: "",
    });
  }, [open, item, form]);

  const mutation = useStockAdjustMutation({
    item,
    onSuccess: () => onOpenChange(false),
  });

  const productName = item?.variant.product.name ?? "variant";
  const sku = item?.variant.sku ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {item
              ? `${productName} (${sku}) at ${item.warehouse.name}. On hand: ${item.quantityOnHand}, available: ${item.quantityAvailable}.`
              : "Adjust inventory quantity."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={ADJUST_FORM_ID}
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue(
                        "quantity",
                        value === "set" && item ? String(item.quantityOnHand) : "",
                      );
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="increase">Increase</SelectItem>
                      <SelectItem value="decrease">Decrease</SelectItem>
                      <SelectItem value="set">Set to</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Qty"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Current on hand: {item?.quantityOnHand ?? 0}.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional notes" {...field} />
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
          <Button type="submit" form={ADJUST_FORM_ID} disabled={!item || mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Apply adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

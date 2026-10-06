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
import { Textarea } from "@/components/ui/textarea";
import { money } from "@/features/dashboard/admin/orders/api/orders";
import { useRefundMutation } from "@/features/dashboard/admin/payments/hooks/use-payment-mutations";
import { refundSchema, type RefundFormValues } from "@/features/dashboard/admin/payments/schemas";
import type { RefundDialogProps } from "@/features/dashboard/admin/payments/types";

const REFUND_FORM_ID = "refund-form";

export type { RefundDialogProps };

export function RefundDialog({ open, onOpenChange, payment }: RefundDialogProps) {
  const maxAmount = Number(payment?.amount ?? 0);
  const schema = refundSchema(Number.isFinite(maxAmount) ? maxAmount : 0);

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(schema) as Resolver<RefundFormValues>,
    defaultValues: { amount: maxAmount || 0, reason: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ amount: Number(payment?.amount ?? 0), reason: "" });
  }, [open, payment, form]);

  const mutation = useRefundMutation({
    payment,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Refund payment</DialogTitle>
          <DialogDescription>
            {payment ? `Refund up to ${money(payment.amount)}.` : "Refund this payment."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={REFUND_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" max={maxAmount} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea maxLength={500} rows={3} placeholder="Refund reason" {...field} />
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
          <Button type="submit" form={REFUND_FORM_ID} disabled={!payment || mutation.isPending}>
            {mutation.isPending ? "Refunding…" : "Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

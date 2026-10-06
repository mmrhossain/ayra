"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { CouponFormFields } from "@/features/dashboard/admin/coupons/components/coupon-form-fields";
import {
  useCouponFormMutation,
  useCouponFormOptions,
} from "@/features/dashboard/admin/coupons/hooks/use-coupon-mutations";
import {
  couponFormSchema,
  type CouponFormValues,
} from "@/features/dashboard/admin/coupons/schemas";
import type { CouponFormDialogProps } from "@/features/dashboard/admin/coupons/types";
import { defaultValues } from "@/features/dashboard/admin/coupons/utils";

const COUPON_FORM_ID = "coupon-form";

export type { CouponFormDialogProps };

export function CouponFormDialog({ open, onOpenChange, mode, initialData }: CouponFormDialogProps) {
  // unique key ব্যবহারের মাধ্যমে Dialog খোলার সময় বা initialData বদলালে অটোমেটিক রিসেট হবে
  const formKey = open ? `${mode}-${initialData?.id ?? "new"}` : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "create" ? "Add Coupon" : "Edit Coupon"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a discount coupon." : "Update coupon details."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CouponFormContent
            key={formKey}
            open={open}
            mode={mode}
            initialData={initialData}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CouponFormContent({ open, mode, initialData, onOpenChange }: CouponFormDialogProps) {
  const [productSearch, setProductSearch] = useState("");

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema) as Resolver<CouponFormValues>,
    defaultValues: defaultValues(initialData),
  });

  const selectedProductIds =
    useWatch({
      control: form.control,
      name: "applicableProductIds",
    }) ?? [];

  const { categoriesQuery, productsQuery, flattenedCategories } = useCouponFormOptions({
    open,
    productSearch,
  });

  const categoryOptions = flattenedCategories.map((item) => ({
    id: item.id,
    label: `${"— ".repeat(item.depth)}${item.name}`,
    hint: item.slug,
  }));

  const products = productsQuery.data?.items ?? [];
  const options = products.map((item) => ({
    id: item.id,
    label: item.name,
    hint: item.slug,
  }));

  const seen = new Set(options.map((item) => item.id));
  for (const id of selectedProductIds) {
    if (!seen.has(id)) {
      options.unshift({ id, label: "Selected product", hint: id });
    }
  }
  const productOptions = options;

  const mutation = useCouponFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <>
      <Form {...form}>
        <form
          id={COUPON_FORM_ID}
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
        >
          <CouponFormFields
            disabled={mutation.isPending}
            productOptions={productOptions}
            categoryOptions={categoryOptions}
            productsLoading={productsQuery.isLoading}
            categoriesLoading={categoriesQuery.isLoading}
            onProductSearchChange={setProductSearch}
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
        <Button type="submit" form={COUPON_FORM_ID} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : mode === "create" ? "Create coupon" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

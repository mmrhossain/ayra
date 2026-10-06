"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
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
import { CouponIdPicker } from "@/features/dashboard/admin/coupons/components/coupon-id-picker";
import type { CouponFormValues } from "@/features/dashboard/admin/coupons/schemas";
import {
  COUPON_STATUSES,
  DISCOUNT_TYPES,
  type CouponFormFieldsProps,
} from "@/features/dashboard/admin/coupons/types";

export function CouponFormFields({
  disabled,
  productOptions,
  categoryOptions,
  productsLoading,
  categoriesLoading,
  onProductSearchChange,
}: CouponFormFieldsProps) {
  const form = useFormContext<CouponFormValues>();
  const discountType = form.watch("discountType");

  return (
    <>
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code</FormLabel>
            <FormControl>
              <Input placeholder="SAVE10" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Summer sale" disabled={disabled} {...field} />
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
              <Textarea
                rows={2}
                placeholder="Optional"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
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
          name="discountValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  step="0.01"
                  disabled={disabled || discountType === "FREE_SHIPPING"}
                  value={
                    discountType === "FREE_SHIPPING"
                      ? 0
                      : field.value === undefined || Number.isNaN(field.value)
                        ? ""
                        : field.value
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="minimumOrderAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={disabled}
                  value={
                    field.value == null || Number.isNaN(field.value)
                      ? ""
                      : field.value
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : e.target.valueAsNumber,
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maximumDiscountAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max discount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={disabled}
                  value={
                    field.value == null || Number.isNaN(field.value)
                      ? ""
                      : field.value
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : e.target.valueAsNumber,
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="usageLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage limit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  disabled={disabled}
                  value={
                    field.value === undefined || Number.isNaN(field.value)
                      ? ""
                      : field.value
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="usageLimitPerCustomer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Per customer</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  disabled={disabled}
                  value={
                    field.value === undefined || Number.isNaN(field.value)
                      ? ""
                      : field.value
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="startsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starts at</FormLabel>
              <FormControl>
                <Input type="datetime-local" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expires at</FormLabel>
              <FormControl>
                <Input type="datetime-local" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COUPON_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
                disabled={disabled}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            </FormControl>
            <FormLabel className="font-normal">Active</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="applicableProductIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Applicable products</FormLabel>
            <FormControl>
              <CouponIdPicker
                options={productOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search products"
                emptyLabel="No products found"
                disabled={disabled}
                loading={productsLoading}
                onSearchChange={onProductSearchChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="applicableCategoryIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Applicable categories</FormLabel>
            <FormControl>
              <CouponIdPicker
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Search categories"
                emptyLabel="No categories found"
                disabled={disabled}
                loading={categoriesLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import type { MutableRefObject } from "react";
import type { UseFormReturn } from "react-hook-form";

import { ImageUpload } from "@/features/dashboard/admin/shared/components/image-upload";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import type { CatalogOption } from "@/features/dashboard/admin/products/types";
import type { FlatCategoryListItem } from "@/features/dashboard/admin/categories/api/categories";
import type { DetailsValues } from "@/features/dashboard/admin/products/types";

type Props = {
  form: UseFormReturn<DetailsValues>;
  categories: FlatCategoryListItem[];
  brands: CatalogOption[];
  slugManual: MutableRefObject<boolean>;
  showPrice?: boolean;
};

export function ProductWizardDetails({
  form,
  categories,
  brands,
  slugManual,
  showPrice = false,
}: Props) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Product name" {...field} />
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
              <FormLabel>
                Slug <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="product-slug"
                  {...field}
                  onChange={(e) => {
                    slugManual.current = true;
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>Must be unique.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Category <span className="text-destructive">*</span>
              </FormLabel>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Need a category first?{" "}
                  <Link href="/admin/categories" className="underline">
                    Create a category
                  </Link>
                </p>
              ) : (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {`${"\u2014 ".repeat(cat.depth)}${cat.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {showPrice ? (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Price <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">BDT</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Saved on the default variant. More variants can be added later.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="brandId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <Select
                onValueChange={(v) =>
                  field.onChange(v === "__none__" ? "" : v)
                }
                value={field.value ? field.value : "__none__"}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">No brand</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Full product description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <ImageUpload
                  mode="multiple"
                  folder="products"
                  maxFiles={5}
                  value={field.value}
                  onChange={(urls) => {
                    field.onChange(urls);
                    const currentPrimary = form.getValues("primaryImageUrl");
                    if (!urls.length) {
                      form.setValue("primaryImageUrl", "", { shouldDirty: true });
                    } else if (!currentPrimary || !urls.includes(currentPrimary)) {
                      form.setValue("primaryImageUrl", urls[0] ?? "", {
                        shouldDirty: true,
                      });
                    }
                  }}
                  primaryUrl={form.watch("primaryImageUrl")}
                  onPrimaryChange={(url) =>
                    form.setValue("primaryImageUrl", url, { shouldDirty: true })
                  }
                />
              </FormControl>
              <FormDescription>Max 5. Set one as primary.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <FormLabel className="cursor-pointer">Featured</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Active products are visible in the storefront.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { useBrandFormMutation } from "@/features/dashboard/admin/brands/hooks/use-brand-mutations";
import {
  brandFormSchema,
  type BrandFormValues,
} from "@/features/dashboard/admin/brands/schemas";
import type { BrandFormDialogProps } from "@/features/dashboard/admin/brands/types";
import {
  brandFormDefaults,
  slugify,
} from "@/features/dashboard/admin/brands/utils";
import { ImageUpload, type ImageUploadHandle } from "@/features/dashboard/admin/shared/components/image-upload";

const BRAND_FORM_ID = "brand-form";

export type { BrandFormDialogProps };

export function BrandFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
}: BrandFormDialogProps) {
  const slugManual = useRef(mode === "edit");
  const imageUploadRef = useRef<ImageUploadHandle>(null);
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: brandFormDefaults(initialData),
  });

  const nameValue = useWatch({
    control: form.control,
    name: "name",
  });

  useEffect(() => {
    if (!open) return;
    slugManual.current = mode === "edit";
    form.reset(brandFormDefaults(initialData));
  }, [open, mode, initialData, form]);

  useEffect(() => {
    if (!open || slugManual.current) return;
    form.setValue("slug", slugify(nameValue ?? ""), { shouldValidate: false });
  }, [nameValue, form, open]);

  const mutation = useBrandFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
    onSlugConflict: () => {
      form.setError("slug", { message: "Must be unique" });
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSaving = isSubmitting || mutation.isPending;
  const submitForm = form.handleSubmit((values) => mutation.mutateAsync(values));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSubmitting(true);
    try {
      await imageUploadRef.current?.flush();
      await submitForm(event);
    } catch {
      // Errors are surfaced by the mutation/form layers.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "create" ? "Add Brand" : "Edit Brand"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a brand. Slug is generated from the name until you edit it."
              : "Update brand details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={BRAND_FORM_ID}
            onSubmit={handleSubmit}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Brand name" {...field} />
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="brand-slug"
                      {...field}
                      onChange={(event) => {
                        slugManual.current = true;
                        field.onChange(event);
                      }}
                    />
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
                    <Textarea placeholder="Optional description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <ImageUpload
                      ref={imageUploadRef}
                      deferUpload
                      mode="single"
                      folder="brands"
                      variantIndex={0}
                      value={field.value}
                      onChange={(url) => {
                        field.onChange(url);
                        if (!url) {
                          form.setValue("logoPublicId", "");
                        }
                      }}
                      onUploaded={(asset) => {
                        form.setValue("logo", asset.url);
                        form.setValue("logoPublicId", asset.publicId);
                      }}
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
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
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
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={BRAND_FORM_ID}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create brand"
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

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
import { ImageUpload } from "@/features/dashboard/admin/shared/components/image-upload";
import { useSliderFormMutation } from "@/features/dashboard/admin/sliders/hooks/use-slider-mutations";
import {
  sliderFormSchema,
  type SliderFormValues,
} from "@/features/dashboard/admin/sliders/schemas";
import type { SliderFormDialogProps } from "@/features/dashboard/admin/sliders/types";
import { defaultValues } from "@/features/dashboard/admin/sliders/utils";

const SLIDER_FORM_ID = "slider-form";

export type { SliderFormDialogProps };

export function SliderFormDialog({ open, onOpenChange, mode, initialData }: SliderFormDialogProps) {
  const form = useForm<SliderFormValues>({
    resolver: zodResolver(sliderFormSchema),
    defaultValues: defaultValues(initialData),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues(initialData));
  }, [open, mode, initialData, form]);

  const mutation = useSliderFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "create" ? "Add Slider" : "Edit Slider"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Upload an image. Desktop (1920x720) and mobile (1080x1350) versions will automatically be created."
              : "Update slider details and image."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={SLIDER_FORM_ID}
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer sale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="redirectUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redirect URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/sale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slider Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      mode="single"
                      folder="slider"
                      variantIndex={0}
                      value={field.value}
                      onChange={(url) => {
                        field.onChange(url);
                        if (!url) {
                          form.setValue("imagePublicId", "", {
                            shouldValidate: true,
                          });
                          form.setValue("mobileImageUrl", "");
                          form.setValue("mobileImagePublicId", "");
                        }
                      }}
                      onUploaded={(asset) => {
                        form.setValue("imageUrl", asset.url, {
                          shouldValidate: true,
                        });
                        form.setValue("imagePublicId", asset.publicId);

                        const mobileUrl = asset.variants?.[1] || asset.url;
                        form.setValue("mobileImageUrl", mobileUrl);
                        form.setValue("mobileImagePublicId", asset.publicId);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
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
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form={SLIDER_FORM_ID} disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : mode === "create"
                ? "Create slider"
                : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

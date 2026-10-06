"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

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
import { AttributeColorField } from "@/features/dashboard/admin/attributes/components/attribute-color-field";
import { useAttributeValueFormMutation } from "@/features/dashboard/admin/attributes/hooks/use-attribute-mutations";
import {
  attributeValueFormSchema,
  type AttributeValueFormValues,
} from "@/features/dashboard/admin/attributes/schemas";
import type { AttributeValueFormDialogProps } from "@/features/dashboard/admin/attributes/types";
import {
  DEFAULT_HEX,
  isColorAttribute,
  normalizeHex,
} from "@/features/dashboard/admin/attributes/utils";

const VALUE_FORM_ID = "attribute-value-form";

export type { AttributeValueFormDialogProps };

export function AttributeValueFormDialog({
  open,
  onOpenChange,
  mode,
  attribute,
  initialData,
}: AttributeValueFormDialogProps) {
  const showColorPicker = isColorAttribute(attribute?.name);

  const form = useForm<AttributeValueFormValues>({
    resolver: zodResolver(attributeValueFormSchema),
    defaultValues: {
      value: "",
      color: DEFAULT_HEX,
      requireColor: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      value: mode === "edit" ? (initialData?.value ?? "") : "",
      color: mode === "edit" ? normalizeHex(initialData?.color) : DEFAULT_HEX,
      requireColor: showColorPicker,
    });
  }, [open, mode, initialData, form, showColorPicker]);

  const mutation = useAttributeValueFormMutation({
    mode,
    attribute,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === "edit" ? "Edit value" : "Add value"}</DialogTitle>
          <DialogDescription>
            {attribute
              ? mode === "edit"
                ? `Update a value for ${attribute.name}.`
                : `Add a value to ${attribute.name}.`
              : "Attribute value"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={VALUE_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {mode === "edit" ? "Value" : "Values"}
                  </FormLabel>
                  <FormControl>
                    {mode === "edit" ? (
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder={showColorPicker ? "Crimson" : "XL"}
                        disabled={mutation.isPending}
                      />
                    ) : (
                      <Textarea
                        {...field}
                        autoComplete="off"
                        rows={3}
                        placeholder={showColorPicker ? "Crimson, Navy" : "M, S, X, XL"}
                        disabled={mutation.isPending}
                      />
                    )}
                  </FormControl>
                  {mode === "edit" ? null : (
                    <p className="text-xs text-muted-foreground">
                      Separate multiple values with commas or new lines.
                      Duplicates are removed automatically.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {showColorPicker ? (
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <AttributeColorField field={field} disabled={mutation.isPending} />
                )}
              />
            ) : null}
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
          <Button type="submit" form={VALUE_FORM_ID} disabled={!attribute || mutation.isPending}>
            {mutation.isPending
              ? mode === "edit"
                ? "Saving..."
                : "Adding..."
              : mode === "edit"
                ? "Save"
                : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

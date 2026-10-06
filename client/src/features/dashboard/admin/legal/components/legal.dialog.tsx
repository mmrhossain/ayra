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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { useLegalFormMutation } from "@/features/dashboard/admin/legal/hooks/use-legal-mutations";
import { legalFormSchema, type LegalFormValues } from "@/features/dashboard/admin/legal/schemas";
import {
  LEGAL_TYPES,
  type LegalFormDialogProps,
  type LegalType,
} from "@/features/dashboard/admin/legal/types";
import { legalFormDefaults, legalTypeLabel } from "@/features/dashboard/admin/legal/utils";

const LEGAL_FORM_ID = "legal-form";

export type { LegalFormDialogProps };

export function LegalFormDialog({ open, onOpenChange, mode, initialData }: LegalFormDialogProps) {
  const form = useForm<LegalFormValues>({
    resolver: zodResolver(legalFormSchema),
    defaultValues: legalFormDefaults(),
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      form.reset(legalFormDefaults(initialData));
      return;
    }
    form.reset(legalFormDefaults());
  }, [open, mode, initialData, form]);

  const mutation = useLegalFormMutation({
    mode,
    initialData,
    onSuccess: () => onOpenChange(false),
  });

  const isPublished = mode === "edit" && initialData?.status === "PUBLISHED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === "edit" ? "Edit legal document" : "Add legal document"}
          </DialogTitle>
          <DialogDescription>
            Drafts can be edited. Published documents need a new version.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={LEGAL_FORM_ID}
            className="flex-1 space-y-4 overflow-y-auto scrollbar-hide"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={mode === "edit"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEGAL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {legalTypeLabel(type as LegalType)}
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
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder="1.0"
                        disabled={mutation.isPending || isPublished}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder="Privacy Policy"
                      disabled={mutation.isPending || isPublished}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled={mutation.isPending || isPublished} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Document content"
                      disabled={mutation.isPending || isPublished}
                    />
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
          <Button type="submit" form={LEGAL_FORM_ID} disabled={mutation.isPending || isPublished}>
            {mutation.isPending ? "Saving..." : mode === "edit" ? "Save" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

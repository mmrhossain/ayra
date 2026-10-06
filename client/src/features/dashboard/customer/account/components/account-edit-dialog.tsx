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
import { ImageUpload } from "@/features/dashboard/admin/shared/components/image-upload";
import {
  accountFormSchema,
  type AccountFormValues,
} from "@/features/dashboard/customer/account/schemas";
import type { AccountEditDialogProps } from "@/features/dashboard/customer/account/types";
import { accountFormDefaults } from "@/features/dashboard/customer/account/utils";
import { useAccountSaveMutation } from "../hooks/use-account";

const ACCOUNT_FORM_ID = "customer-account-form";

export function AccountEditDialog({
  open,
  onOpenChange,
  profile,
  imageUrl,
}: AccountEditDialogProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: accountFormDefaults(profile, imageUrl),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(accountFormDefaults(profile, imageUrl));
  }, [open, profile, imageUrl, form]);

  const mutation = useAccountSaveMutation({
    profile,
    imageUrl,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your photo, date of birth, and gender.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={ACCOUNT_FORM_ID}
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile photo</FormLabel>
                  <FormControl>
                    <ImageUpload
                      mode="single"
                      folder="profiles"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="h-11 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full h-11 rounded-xl">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={ACCOUNT_FORM_ID}
            disabled={mutation.isPending}
            className="bg-slate-900 text-white hover:bg-primary"
          >
            {mutation.isPending ? "Saving..." : "Save profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

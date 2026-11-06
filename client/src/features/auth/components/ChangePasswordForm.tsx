"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  changePasswordDefaults,
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/features/auth/schemas/changePasswordSchema";
import { changePassword } from "@/features/auth/lib/change-password";
import { errorToast, successToast } from "@/helpers";

type ChangePasswordFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ChangePasswordForm({
  onSuccess,
  onCancel,
  submitLabel = "Update password",
}: ChangePasswordFormProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaults,
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    const result = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: data.revokeOtherSessions,
    });

    if (!result.ok) {
      errorToast(result.message);
      return;
    }

    successToast(
      data.revokeOtherSessions
        ? "Password updated. Other sessions were signed out."
        : "Password updated.",
    );
    form.reset(changePasswordDefaults);
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                    className="pr-10"
                    {...field}
                  />
                  <PasswordToggle
                    shown={showCurrent}
                    onToggle={() => setShowCurrent((value) => !value)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="pr-10"
                    {...field}
                  />
                  <PasswordToggle
                    shown={showNew}
                    onToggle={() => setShowNew((value) => !value)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    className="pr-10"
                    {...field}
                  />
                  <PasswordToggle
                    shown={showConfirm}
                    onToggle={() => setShowConfirm((value) => !value)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="revokeOtherSessions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-2.5 rounded-lg border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-0.5">
                <FormLabel className="cursor-pointer text-sm font-medium">
                  Sign out other devices
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Ends every other active session except this one.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PasswordToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import AuthCard, {
  AuthSpinner,
  authInputClass,
  authSubmitClass,
} from "@/features/auth/components/AuthCard";
import {
  ResetPasswordFormData,
  resetPasswordSchema,
} from "@/features/auth/schemas/resetPasswordSchema";
import { errorToast, successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const ResetPasswordForm: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");
  const isInvalidToken = !token || tokenError?.toUpperCase() === "INVALID_TOKEN";

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      errorToast("Reset link is missing or invalid.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        errorToast(error.message ?? "Could not reset password");
        return;
      }

      successToast("Password updated. Please sign in.");
      router.push("/login");
    } catch {
      errorToast("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isInvalidToken) {
    return (
      <AuthCard
        title="Invalid Reset Link"
        description="This password reset link is missing, expired, or already used."
        maxWidth="sm"
        minHeight="default"
        backHref="/login"
      >
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Request a new reset link to continue.
        </p>
        <Link href="/forget-password" className={`${authSubmitClass} mt-5`}>
          Request New Link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Choose a new password for your account"
      maxWidth="sm"
      minHeight="default"
      backHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label className="text-slate-700 font-medium mb-1.5 inline-block">
                  New Password
                </Label>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      autoComplete="new-password"
                      className={authInputClass}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-primary"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password_confirmation"
            render={({ field }) => (
              <FormItem>
                <Label className="text-slate-700 font-medium mb-1.5 inline-block">
                  Confirm Password
                </Label>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="********"
                      autoComplete="new-password"
                      className={authInputClass}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                      }
                      className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )}
          />

          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? <AuthSpinner /> : "Update Password"}
          </button>
        </form>
      </Form>
    </AuthCard>
  );
};

export default ResetPasswordForm;

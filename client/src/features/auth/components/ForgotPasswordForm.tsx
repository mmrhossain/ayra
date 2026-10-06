"use client";

import { CALLBACK_URL } from "@/config";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
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
  ForgotPasswordFormData,
  forgotPasswordSchema,
} from "@/features/auth/schemas/forgotPasswordSchema";
import { errorToast, successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import Link from "next/link";

const ForgotPasswordForm: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const appUrl = CALLBACK_URL || (typeof window !== "undefined" ? window.location.origin : "");

      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) {
        errorToast(error.message ?? "Could not send reset email");
        return;
      }

      setSubmitted(true);
      successToast("If an account exists, a reset link has been sent.");
    } catch {
      errorToast("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot Password"
      description="Enter your email and we will send you a reset link"
      maxWidth="sm"
      minHeight="default"
      backHref="/login"
    >
      {submitted ? (
        <div className="space-y-5">
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            If an account exists for that email, a password reset link has been sent. Please check
            your inbox.
          </p>
          <Link href="/login" className={authSubmitClass}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-slate-700 font-medium mb-1.5 inline-block">Email</Label>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck="false"
                        className={authInputClass}
                        {...field}
                      />
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary">
                        <Mail size={20} />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-danger" />
                </FormItem>
              )}
            />

            <button type="submit" disabled={loading} className={authSubmitClass}>
              {loading ? <AuthSpinner /> : "Send Reset Link"}
            </button>
          </form>
        </Form>
      )}

      {!submitted ? (
        <p className="text-center text-sm text-slate-600 mt-5">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-primary font-bold hover:underline underline-offset-4 ml-1"
          >
            Sign In
          </Link>
        </p>
      ) : null}
    </AuthCard>
  );
};

export default ForgotPasswordForm;

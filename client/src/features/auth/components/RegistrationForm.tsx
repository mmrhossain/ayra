"use client";

import { CALLBACK_URL } from "@/config";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, UserRound } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

import AuthCard, {
  AuthSpinner,
  authInputClass,
  authSubmitClass,
} from "@/features/auth/components/AuthCard";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import {
  RegistrationFormData,
  registrationSchema,
} from "@/features/auth/schemas/registrationSchema";
import { successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const RegistrationForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      identifier: "",
      password: "",
      password_confirmation: "",
      remember: false,
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setFormError(null);
    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email: data.identifier,
        password: data.password,
        name: data.fullName,
        callbackURL: `${CALLBACK_URL}/login`,
      });

      if (error) {
        setFormError(error.message ?? "নিবন্ধন ব্যর্থ হয়েছে");
        return;
      }
      successToast("Please check your email to verify your account.");
      router.push(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
      // router.refresh();
    } catch {
      setFormError("সার্ভারে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create an Account" description="Join us today and start shopping">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <Label className="text-slate-700 font-medium mb-1.5 inline-block">Full Name</Label>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className={authInputClass}
                      {...field}
                    />
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary">
                      <UserRound size={20} />
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <Label className="text-slate-700 font-medium mb-1.5 inline-block">Email</Label>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type="text"
                      placeholder="Enter your email"
                      autoComplete="username"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck="false"
                      className={authInputClass}
                      {...field}
                    />
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary">
                      <Mail size={20} />
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label className="text-slate-700 font-medium mb-1.5 inline-block">Password</Label>
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
                      className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 hover:text-primary"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
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
                      className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center text-gray-400 hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )}
          />

          {/* Terms */}
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0 pt-2">
                <FormControl>
                  <Checkbox
                    id="terms"
                    className="mt-1 rounded border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label
                  htmlFor="terms"
                  className="text-slate-600 text-sm leading-relaxed cursor-pointer select-none"
                >
                  I have read and agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    terms & conditions
                  </Link>
                </Label>
              </FormItem>
            )}
          />

          {formError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? <AuthSpinner /> : "Register"}
          </button>
        </form>
      </Form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400">or</span>
        </div>
      </div>

      <GoogleSignInButton />

      <p className="mt-5 px-1 text-center text-sm leading-relaxed text-slate-600">
        Already have an account?{" "}
        <Link
          href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
          className="text-primary font-bold hover:underline underline-offset-4 ml-1"
        >
          Login
        </Link>
      </p>
    </AuthCard>
  );
};

export default RegistrationForm;

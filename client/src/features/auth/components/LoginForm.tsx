"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import AuthCard, {
  AuthSpinner,
  authInputClass,
  authSubmitClass,
} from "@/features/auth/components/AuthCard";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import { LoginFormData, loginSchema } from "@/features/auth/schemas/loginSchema";
import { mergeGuestCartOnLogin, toCartErrorMessage } from "@/features/cart/api";
import { errorToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const oauthError = searchParams.get("error");

  React.useEffect(() => {
    if (!oauthError) return;
    errorToast("Google sign-in failed. Please try again.");
  }, [oauthError]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: data.identifier,
        password: data.password,
        rememberMe: data.remember === true,
      });

      if (error) {
        const message = error.message ?? "Sign in failed";
        if (/account suspended/i.test(message)) {
          errorToast("Account suspended. Contact support if you believe this is a mistake.");
          return;
        }
        errorToast(`${message}`);
        return;
      }

      try {
        await mergeGuestCartOnLogin();
        await Promise.all([
          useCartStore.getState().fetchCart(),
          useWishStore.getState().fetchWishList(),
        ]);
      } catch (mergeErr) {
        console.error(toCartErrorMessage(mergeErr));
      }

      router.push(redirect || "/");
    } catch {
      errorToast("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome Back"
      description="Please enter your details to sign in"
      maxWidth="sm"
      minHeight="default"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <Label className="text-slate-700 font-medium mb-1.5 inline-block">
                  Email or Phone
                </Label>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type="text"
                      placeholder="Enter your email or phone"
                      autoComplete="username"
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

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <Label className="font-medium text-slate-700">Password</Label>
                  <Link href="/forget-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
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

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="remember"
                    className="rounded border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label
                  htmlFor="remember"
                  className="text-slate-600 text-sm cursor-pointer select-none"
                >
                  Keep me logged in
                </Label>
              </FormItem>
            )}
          />

          {/* Login Button */}
          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? <AuthSpinner /> : "Sign In"}
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
        Don&apos;t have an account?{" "}
        <Link
          href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
          className="text-primary font-bold hover:underline underline-offset-4 ml-1"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
};

export default LoginForm;

"use client";

import { errorToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  oauthCallbackUrl,
  oauthErrorCallbackUrl,
  safeRedirectPath,
} from "@/features/auth/lib/oauth";

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.48a5.54 5.54 0 0 1-2.4 3.63v3.01h3.87c2.26-2.08 3.54-5.15 3.54-8.88Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3.01c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.24v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.26A7.21 7.21 0 0 1 4.87 12c0-.79.14-1.55.38-2.26V6.63H1.24A12 12 0 0 0 0 12c0 1.94.46 3.77 1.24 5.37l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.14 15.24 0 12 0 7.31 0 3.26 2.69 1.24 6.63l4.01 3.11C6.2 6.87 8.86 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = safeRedirectPath(searchParams.get("redirect"));

  const onClick = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: oauthCallbackUrl(redirect),
        errorCallbackURL: oauthErrorCallbackUrl(redirect),
      });
      if (error) {
        errorToast(error.message ?? "Google sign-in failed");
      }
    } catch {
      errorToast("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-11 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
          aria-hidden="true"
        />
      ) : (
        <GoogleMark />
      )}
      Continue with Google
    </button>
  );
}

"use client";

import { safeRedirectPath } from "@/features/auth/lib/oauth";
import { mergeGuestCartOnLogin, toCartErrorMessage } from "@/features/cart/api";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function OAuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        await mergeGuestCartOnLogin();
        await Promise.all([
          useCartStore.getState().fetchCart(),
          useWishStore.getState().fetchWishList(),
        ]);
      } catch (mergeErr) {
        console.error(toCartErrorMessage(mergeErr));
      } finally {
        if (!cancelled) {
          router.replace(redirect);
        }
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [redirect, router]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4">
      <p className="text-sm text-slate-600">Signing you in...</p>
    </div>
  );
}

export default function OAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh w-full items-center justify-center px-4">
          <p className="text-sm text-slate-600">Signing you in...</p>
        </div>
      }
    >
      <OAuthComplete />
    </Suspense>
  );
}

"use client";

import { TopProgressBar } from "@/components/shared/TopProgressBar";
import { safeRedirectPath } from "@/features/auth/lib/oauth";
import { mergeGuestCartOnLogin, toCartErrorMessage } from "@/features/cart/api";
import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole, staffDashboardPath } from "@/lib/api/auth/roles";
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

    const syncCustomerData = async () => {
      try {
        await mergeGuestCartOnLogin();
        await Promise.all([
          useCartStore.getState().fetchCart(),
          useWishStore.getState().fetchWishList(),
        ]);
      } catch (syncErr) {
        console.error(toCartErrorMessage(syncErr));
      }
    };

    const finish = async () => {
      let role: string | null | undefined;
      let sessionLoaded = false;
      try {
        const { data: session } = await authClient.getSession();
        role = session?.user?.role;
        sessionLoaded = true;
      } catch (sessionErr) {
        console.error(toCartErrorMessage(sessionErr));
      }

      const dashboard = staffDashboardPath(role);
      if (!cancelled) router.replace(dashboard ?? redirect);

      if (sessionLoaded && !isStaffRole(role)) {
        void syncCustomerData();
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [redirect, router]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white px-4">
      <TopProgressBar active />
      <p className="sr-only">Signing you in</p>
    </div>
  );
}

export default function OAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh w-full items-center justify-center bg-white px-4">
          <TopProgressBar active />
          <p className="sr-only">Signing you in</p>
        </div>
      }
    >
      <OAuthComplete />
    </Suspense>
  );
}

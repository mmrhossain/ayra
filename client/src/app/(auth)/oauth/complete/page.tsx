"use client";

import { TopProgressBar } from "@/components/shared/TopProgressBar";
import { safeRedirectPath } from "@/features/auth/lib/oauth";
import { mergeGuestCartOnLogin, toCartErrorMessage } from "@/features/cart/api";
import { authClient } from "@/lib/api/auth/auth-client";
import { isStaffRole, staffDashboardPath } from "@/lib/api/auth/roles";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function OAuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      let role: string | null | undefined;
      let signedIn = false;
      try {
        const { data: session } = await authClient.getSession();
        role = session?.user?.role;
        signedIn = Boolean(session?.user);
      } catch (sessionErr) {
        console.error(toCartErrorMessage(sessionErr));
      }

      if (cancelled) return;
      if (signedIn && !isStaffRole(role)) {
        try {
          await mergeGuestCartOnLogin();
        } catch (syncErr) {
          console.error(toCartErrorMessage(syncErr));
        }
      }
      if (!cancelled) router.replace(staffDashboardPath(role) ?? redirect);
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

"use client";

import { STAFF_CANNOT_SHOP_MESSAGE, STAFF_SHOPPING_NOTICE } from "@/lib/api/auth/roles";
import { authClient } from "@/lib/api/auth/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function StaffShoppingNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const visible = params.get("notice") === STAFF_SHOPPING_NOTICE;

  const dismiss = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("notice");
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }, [params, router]);

  const signOut = useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  }, [router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-medium">{STAFF_CANNOT_SHOP_MESSAGE}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={dismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

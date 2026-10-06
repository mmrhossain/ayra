"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";

// Hydration Mismatch ও useEffect-এর setState এরর ছাড়া mounted ট্র্যাক করার নিয়ম
const emptySubscribe = () => () => {};
function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true, // Client-side এ true হবে
    () => false // Server-side (SSR) এ false হবে
  );
}

export function DashboardTopbar() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  // কোনো useState / useEffect ছাড়াই safe mounted চেক
  const mounted = useIsMounted();

  const { data } = authClient.useSession();
  const user = data?.user;

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          successToast("Logout successful!");
        },
      },
    });
  };

  const isDark = resolvedTheme === "dark";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger className="size-9" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="h-6" />
      <div className="ml-auto flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={
            mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Switch theme"
          }
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted ? (
            isDark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )
          ) : (
            <span className="size-4" />
          )}
        </Button>
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium leading-none">{user?.name || "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email || "Signed in"}</p>
        </div>
        <UserAvatar src={user?.image} name={user?.name} className="h-9 w-9 border" iconSize={18} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}

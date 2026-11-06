"use client";

import { KeyRound, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ChangePasswordDialog } from "@/components/shared/change-password-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
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

  const [passwordOpen, setPasswordOpen] = React.useState(false);

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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="size-9" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="h-6" />
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <NotificationBell viewAllHref="/admin/notifications" />
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <UserAvatar
                src={user?.image}
                name={user?.name}
                className="h-9 w-9 border"
                iconSize={18}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">
                {user?.name || "Account"}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user?.email || "Signed in"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
              <KeyRound />
              Change password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </header>
  );
}

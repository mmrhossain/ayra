"use client";

import { ChangePasswordDialog } from "@/components/shared/change-password-dialog";
import { authClient } from "@/lib/api/auth/auth-client";
import { successToast } from "@/helpers";
import clsx from "clsx";
import { ChevronDown, Heart, KeyRound, LogOut, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";

const sidebarItems = [
  { label: "Account Details", href: "/customer/account", icon: User },
  { label: "Order History", href: "/customer/orders", icon: Package },
  { label: "Saved Addresses", href: "/customer/address", icon: MapPin },
  { label: "My Wishlist", href: "/customer/wish-list", icon: Heart },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const activeItem = sidebarItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          successToast("Logged out");
          router.push("/");
        },
      },
    });
  };

  return (
    <aside className="w-full lg:w-72 bg-card rounded-xl border border-border overflow-hidden shadow-sm h-fit">
      <button
        type="button"
        aria-label="Toggle account navigation"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen(open => !open)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:hidden"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manage account</span>
          <span className="mt-1 block truncate text-sm font-semibold">{activeItem?.label ?? "Account menu"}</span>
        </span>
        <ChevronDown aria-hidden className={clsx("size-4 shrink-0 transition-transform", menuOpen && "rotate-180")} />
      </button>
      <div className="hidden border-b border-border bg-muted p-6 lg:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Manage Account
        </p>
      </div>

      <nav id={menuId} aria-label="Customer account" className={clsx("p-2 sm:p-3", !menuOpen && "hidden lg:block")}>
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3.5 sm:px-4 py-3 min-h-11 text-sm font-semibold rounded-xl transition-all duration-300 group relative",
                    isActive
                      ? "bg-primary/5 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {/* Active Bar Indicator */}
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-full" />
                  )}

                  <Icon
                    size={18}
                    className={clsx(
                      "transition-transform duration-300 group-hover:scale-110",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 mx-4 border-t border-border" />

        {/* Change Password Button */}
        <button
          onClick={() => setPasswordOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all duration-300 group"
        >
          <KeyRound
            size={18}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
          Change Password
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
        >
          <LogOut
            size={18}
            className="text-muted-foreground group-hover:text-red-600 transition-colors"
          />
          Logout Account
        </button>
      </nav>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </aside>
  );
};

export default Sidebar;

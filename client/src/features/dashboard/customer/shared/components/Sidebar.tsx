"use client";

import { ChangePasswordDialog } from "@/components/shared/change-password-dialog";
import { authClient } from "@/lib/api/auth/auth-client";
import { successToast } from "@/helpers";
import clsx from "clsx";
import { Heart, KeyRound, LogOut, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
    <aside className="w-full md:w-72 bg-card rounded-xl border border-border overflow-hidden shadow-sm h-fit">
      {/* User Header (Optional but recommended) */}
      <div className="p-4 sm:p-6 border-b border-border bg-muted">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Manage Account
        </p>
      </div>

      <nav className="p-2 sm:p-3">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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

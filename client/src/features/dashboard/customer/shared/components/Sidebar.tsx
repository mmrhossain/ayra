"use client";

import { authClient } from "@/lib/api/auth/auth-client";
import { successToast } from "@/helpers";
import clsx from "clsx";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const sidebarItems = [
  { label: "Account Details", href: "/customer/account", icon: User },
  { label: "Order History", href: "/customer/orders", icon: Package },
  { label: "Saved Addresses", href: "/customer/address", icon: MapPin },
  { label: "My Wishlist", href: "/customer/wish-list", icon: Heart },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="w-full md:w-72 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm h-fit">
      {/* User Header (Optional but recommended) */}
      <div className="p-4 sm:p-6 border-b border-slate-50 bg-slate-50/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
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
                        : "text-slate-400 group-hover:text-slate-900",
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 mx-4 border-t border-slate-100" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
        >
          <LogOut
            size={18}
            className="text-slate-400 group-hover:text-red-600 transition-colors"
          />
          Logout Account
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;

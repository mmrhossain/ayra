"use client";

import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";
import { BottomNavbar } from "@/types/bottomNavbar";
import { Heart, Home, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

export const footerNavigationItems: BottomNavbar[] = [
  { label: "Home", path: "/", icon: <Home size={20} /> },
  { label: "Shop", path: "/shop", icon: <Store size={20} /> },
  { label: "Cart", path: "/cart", icon: <ShoppingBag size={20} /> },
  { label: "Wishlist", path: "/customer/wish-list", icon: <Heart size={20} /> },
];

const emptySubscribe = () => () => {};

const FooterNavigationMenu = () => {
  const pathname = usePathname();

  // Prevents SSR hydration mismatch for client-only store counts
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const cartCount = useCartStore((state) => state.cartCount);
  const wishCount = useWishStore((state) => state.wishCount);

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 z-40 w-full bg-white/90 pb-safe backdrop-blur-lg border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] lg:hidden"
    >
      <ul className="grid grid-cols-4 items-center h-16 w-full max-w-md mx-auto px-2">
        {footerNavigationItems.map(({ label, path, icon }) => {
          const href = path ?? "/";
          const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);

          const count = label === "Cart" ? cartCount : label === "Wishlist" ? wishCount : 0;

          const shouldShowBadge = isHydrated && count > 0;

          return (
            <li key={label} className="flex justify-center group">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="w-full py-1 flex flex-col items-center justify-center focus:outline-none active:scale-95 transition-transform"
              >
                <div className="relative">
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "text-slate-500 group-hover:text-primary"
                    }`}
                  >
                    {icon}
                  </div>

                  {shouldShowBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] mt-1 font-bold uppercase tracking-wider truncate max-w-[64px] text-center transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default FooterNavigationMenu;

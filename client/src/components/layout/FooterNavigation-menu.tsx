"use client";

import MobileCategoryItem from "@/features/catalog/components/category/MobileCategory";
import { SITE_LOGO } from "@/config/site";
import { CategoryListItem } from "@/features/catalog/types";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { authClient } from "@/lib/api/auth/auth-client";
import { staffDashboardPath, staffShoppingRedirect } from "@/lib/api/auth/roles";
import { useWishStore } from "@/stores/useWishStore";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Home, LayoutGrid, Store, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

type BottomNavbar = {
  label: string;
  path?: string;
  icon: ReactNode;
};

export const footerNavigationItems: BottomNavbar[] = [
  { label: "Home", path: "/", icon: <Home size={20} /> },
  { label: "Shop", path: "/shop", icon: <Store size={20} /> },
  { label: "Categories", path: "#", icon: <LayoutGrid size={20} /> },
  { label: "Wishlist", path: "/customer/wish-list", icon: <Heart size={20} /> },
  { label: "Account", path: "/customer/account", icon: <User size={20} /> },
];

const emptySubscribe = () => () => {};

interface FooterNavigationMenuProps {
  categories?: CategoryListItem[];
}

const FooterNavigationMenu = ({ categories = [] }: FooterNavigationMenuProps) => {
  const { store } = usePublicSettings();
  const pathname = usePathname();
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Lock body scroll when category sidebar is open
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (categoriesDrawerOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [categoriesDrawerOpen]);

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { data } = authClient.useSession();
  const user = data?.user;

  const getUserDashboardUrl = (role?: string) =>
    staffDashboardPath(role) ?? "/customer/account";

  const wishCount = useWishStore((state) => state.wishCount);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const closeDrawer = () => setCategoriesDrawerOpen(false);

  return (
    <>
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 z-40 w-full bg-white/90 pb-safe backdrop-blur-lg border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] lg:hidden"
      >
        <ul className="grid grid-cols-5 items-center h-16 w-full max-w-md mx-auto px-2">
          {footerNavigationItems.map(({ label, path, icon }) => {
            let href = path ?? "/";
            if (label === "Account" && user) {
              href = getUserDashboardUrl(user.role as string);
            }
            if (label === "Wishlist" && user) {
              href = staffShoppingRedirect(user.role as string) ?? href;
            }

            const isCategories = label === "Categories";
            const isActive = isCategories
              ? categoriesDrawerOpen
              : href === "/"
                ? pathname === "/"
                : pathname?.startsWith(href);

            const count = label === "Wishlist" ? wishCount : 0;
            const shouldShowBadge = isHydrated && count > 0;

            if (isCategories) {
              return (
                <li key={label} className="flex justify-center group">
                  <button
                    type="button"
                    onClick={() => setCategoriesDrawerOpen((prev) => !prev)}
                    className="w-full py-1 flex flex-col items-center justify-center focus:outline-none active:scale-95 transition-transform"
                  >
                    <div
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                          : "text-slate-500 group-hover:text-primary"
                      }`}
                    >
                      {icon}
                    </div>

                    <span
                      className={`mt-1 max-w-[64px] truncate text-center text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                        isActive ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={label} className="flex justify-center group">
                <Link
                  href={href}
                  onClick={closeDrawer}
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
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </div>

                  <span
                    className={`mt-1 max-w-[64px] truncate text-center text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
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

      {/* Category Left Sidebar Drawer */}
      <AnimatePresence>
        {categoriesDrawerOpen && (
          <div
            className="fixed inset-0 z-[10000] h-dvh overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-label="Category Navigation Menu"
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Escape") {
                closeDrawer();
              }
            }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={backdropVariants}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.2,
              }}
              onClick={closeDrawer}
            />

            {/* Sidebar Content Container */}
            <motion.div
              className="absolute left-0 top-0 flex h-dvh max-h-dvh w-[min(88%,24rem)] max-w-sm flex-col bg-white shadow-2xl"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      damping: 25,
                      stiffness: 200,
                    }
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div className="flex h-8 w-[120px] items-center overflow-hidden">
                  <Link href="/" onClick={closeDrawer} className="relative block h-8 w-full">
                    <Image
                      src={store.logoUrl || SITE_LOGO}
                      alt={store.name}
                      unoptimized
                      fill
                      sizes="120px"
                      priority
                      className="object-contain object-left"
                    />
                  </Link>
                </div>

                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                  onClick={closeDrawer}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Categories List */}
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                <ul className="flex flex-col text-slate-800">
                  <li className="px-5 pt-6 pb-2 text-xs font-medium tracking-wide uppercase text-gray-400">
                    Categories
                  </li>

                  {categories?.map((category) => (
                    <MobileCategoryItem
                      key={category.id}
                      category={category}
                      onNavigate={closeDrawer}
                    />
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FooterNavigationMenu;

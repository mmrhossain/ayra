"use client";

import MobileCategoryItem from "@/features/catalog/components/category/MobileCategory";
import { SITE_LOGO } from "@/config/site";
import { isCloudinaryUrl } from "@/helpers/cloudinary";
import { CategoryListItem } from "@/features/catalog/types";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { authClient } from "@/lib/api/auth/auth-client";
import { staffDashboardPath, staffShoppingRedirect } from "@/lib/api/auth/roles";
import { NavbarCountBadge } from "@/components/layout/NavbarCountBadge";
import { useStorefrontCountBadge } from "@/hooks/useStorefrontCounts";
import { cn } from "@/lib/utils";
import { AnimatePresence, LazyMotion, m, useReducedMotion } from "framer-motion";
import { Heart, Home, LayoutGrid, Store, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

const loadMotionFeatures = () => import("@/lib/motion-features").then(module => module.default);

interface FooterNavigationMenuProps {
  categories?: CategoryListItem[];
  initialIsCustomer?: boolean;
}

const FooterNavigationMenu = ({ categories = [], initialIsCustomer }: FooterNavigationMenuProps) => {
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

  const { data } = authClient.useSession();
  const user = data?.user;

  const getUserDashboardUrl = (role?: string) =>
    staffDashboardPath(role) ?? "/customer/account";

  const wishBadge = useStorefrontCountBadge("wishlist", initialIsCustomer);

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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe shadow-[0_-4px_18px_rgba(0,0,0,0.05)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-16 w-full max-w-lg grid-cols-5 items-center gap-1 px-2 sm:px-4">
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

            const isWishlist = label === "Wishlist";
            const itemClass = cn(
              "flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5",
              "text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isActive && "font-semibold text-foreground",
            );
            const content = (
              <>
                <span className={cn(
                  "relative flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-muted text-foreground",
                )}>
                  <span aria-hidden="true">{icon}</span>
                  {isWishlist && <NavbarCountBadge {...wishBadge} className="-top-0.5 right-0 ring-2 ring-background" />}
                </span>
                <span className="max-w-full truncate text-[11px] leading-4">{label}</span>
              </>
            );

            return (
              <li key={label} className="min-w-0">
                {isCategories ? (
                  <button
                    type="button"
                    aria-expanded={categoriesDrawerOpen}
                    aria-controls={categoriesDrawerOpen ? "mobile-category-navigation" : undefined}
                    onClick={() => setCategoriesDrawerOpen(open => !open)}
                    className={itemClass}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    prefetch={false}
                    href={href}
                    onClick={closeDrawer}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={isWishlist ? wishBadge.loading ? "Wishlist, loading item count" : `Wishlist, ${wishBadge.count} items` : undefined}
                    className={itemClass}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Category Left Sidebar Drawer */}
      <AnimatePresence>
        {categoriesDrawerOpen && (
          <LazyMotion features={loadMotionFeatures}>
          <div
            id="mobile-category-navigation"
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
            <m.div
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
            <m.div
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
                  <Link prefetch={false} href="/" onClick={closeDrawer} className="relative block h-8 w-full">
                    <Image
                      src={store.logoUrl || SITE_LOGO}
                      alt={store.name}
                      unoptimized={Boolean(store.logoUrl && !isCloudinaryUrl(store.logoUrl))}
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
            </m.div>
          </div>
          </LazyMotion>
        )}
      </AnimatePresence>
    </>
  );
};

export default FooterNavigationMenu;

"use client";

import SearchDrawer from "@/components/shared/Search.drawer";
import { SITE_LOGO } from "@/config/site";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { authClient } from "@/lib/api/auth/auth-client";
import { staffShoppingRedirect } from "@/lib/api/auth/roles";
import { useCartStore } from "@/stores/useCartStore";
import { Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

const useIsHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

const MobileNavbar = () => {
  const { store } = usePublicSettings();
  const [searchDrawerOpen, setSearchDrawerOpen] = useState<boolean>(false);
  const isHydrated = useIsHydrated();

  const cartCount = useCartStore((state) => state.cartCount);
  const shouldShowCartBadge = isHydrated && cartCount > 0;
  const { data } = authClient.useSession();
  const cartHref = staffShoppingRedirect(data?.user?.role) ?? "/cart";

  return (
    <div className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs lg:hidden">
      <div className="container flex min-w-0 items-center justify-between gap-3 py-2.5">
        {/* Logo */}
        <div className="flex h-11 w-[100px] shrink-0 items-center overflow-hidden">
          <Link
            href="/"
            className="relative block h-8 w-full"
            aria-label={`${store.name} Home`}
          >
            <Image
              src={store.logoUrl || SITE_LOGO}
              alt={store.name}
              unoptimized
              fill
              sizes="100px"
              priority
              className="object-contain object-left"
            />
          </Link>
        </div>

        {/* Center Search Bar Trigger */}
        <button
          type="button"
          onClick={() => setSearchDrawerOpen(true)}
          className="flex h-11 min-h-11 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-slate-400 transition-colors hover:border-slate-300 active:bg-slate-100"
          aria-label="Search products"
        >
          <Search size={16} className="text-slate-400 shrink-0" strokeWidth={2} />
          <span className="truncate text-xs font-medium text-slate-400">Search...</span>
        </button>

        {/* Cart Action */}
        <Link
          href={cartHref}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-700 transition-all active:scale-95"
          aria-label="Cart"
        >
          <ShoppingBag size={19} strokeWidth={2} />
          {shouldShowCartBadge && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      <Suspense fallback={null}>
        {searchDrawerOpen && <SearchDrawer onClose={() => setSearchDrawerOpen(false)} />}
      </Suspense>
    </div>
  );
};

export default MobileNavbar;

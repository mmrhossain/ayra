"use client";

import dynamic from "next/dynamic";
import { SITE_LOGO } from "@/config/site";
import { isCloudinaryUrl } from "@/helpers/cloudinary";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { authClient } from "@/lib/api/auth/auth-client";
import { staffShoppingRedirect } from "@/lib/api/auth/roles";
import { NavbarCountBadge } from "@/components/layout/NavbarCountBadge";
import { useStorefrontCountBadge } from "@/hooks/useStorefrontCounts";
import { Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";

const SearchDrawer = dynamic(() => import("@/components/shared/Search.drawer"), { ssr: false });

const MobileNavbar = ({ actions }: { actions?: ReactNode }) => {
  const { store } = usePublicSettings();
  const [searchDrawerOpen, setSearchDrawerOpen] = useState<boolean>(false);
  const cartBadge = useStorefrontCountBadge("cart");
  const { data } = authClient.useSession();
  const cartHref = staffShoppingRedirect(data?.user?.role) ?? "/cart";

  return (
    <div className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs lg:hidden">
      <div className="container flex min-w-0 items-center justify-between gap-3 py-2.5">
        {/* Logo */}
        <div className="flex h-11 w-[100px] shrink-0 items-center overflow-hidden">
          <Link prefetch={false}
            href="/"
            className="relative block h-8 w-full"
            aria-label={`${store.name} Home`}
          >
            <Image
              src={store.logoUrl || SITE_LOGO}
              alt={store.name}
              unoptimized={Boolean(store.logoUrl && !isCloudinaryUrl(store.logoUrl))}
              fill
              sizes="100px"
              priority
              className="object-contain object-left"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setSearchDrawerOpen(true)}
          className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-700 transition-colors hover:bg-slate-200 active:bg-slate-200"
          aria-label="Search products"
          aria-expanded={searchDrawerOpen}
        >
          <Search aria-hidden="true" size={19} strokeWidth={2} />
        </button>

        {/* Cart Action */}
        <Link prefetch={false}
          href={cartHref}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-700 transition-all active:scale-95"
          aria-label={cartBadge.loading ? "Cart, loading item count" : cartBadge.count === null ? "Cart" : `Cart, ${cartBadge.count} items`}
        >
          <ShoppingBag size={19} strokeWidth={2} />
          <NavbarCountBadge {...cartBadge} className="-top-0.5 -right-0.5 ring-2 ring-white" />
        </Link>

        {actions}
      </div>

      <Suspense fallback={null}>
        {searchDrawerOpen && <SearchDrawer onClose={() => setSearchDrawerOpen(false)} />}
      </Suspense>
    </div>
  );
};

export default MobileNavbar;

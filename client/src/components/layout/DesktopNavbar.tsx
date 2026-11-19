"use client";

import { ChevronDown, Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import SearchBox from "@/components/shared/SearchBox";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SITE_LOGO } from "@/config/site";
import { isCloudinaryUrl } from "@/helpers/cloudinary";
import dynamic from "next/dynamic";
import { CategoryListItem } from "@/features/catalog/types";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import { successToast } from "@/helpers";
import { NavbarCountBadge } from "@/components/layout/NavbarCountBadge";
import { useStorefrontCountBadge } from "@/hooks/useStorefrontCounts";
import { authClient } from "@/lib/api/auth/auth-client";
import { staffDashboardPath, staffShoppingRedirect } from "@/lib/api/auth/roles";

const CategoryMegaMenu = dynamic(() => import("@/features/catalog/components/category/CategoryMegaMenu"), { ssr: false });

const DeskTopNavbar = ({ categories, actions, initialIsCustomer }: {
  categories: CategoryListItem[];
  actions?: ReactNode;
  initialIsCustomer: boolean;
}) => {
  const { store } = usePublicSettings();
  const cartBadge = useStorefrontCountBadge("cart");
  const wishBadge = useStorefrontCountBadge("wishlist", initialIsCustomer);
  const router = useRouter();

  const [selectedCatName, setSelectedCatName] = useState("All Categories");
  const [categoryMenuReady, setCategoryMenuReady] = useState(false);

  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  const showSessionPlaceholder = isPending;

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

  const getAccountHref = () => staffDashboardPath(user?.role) ?? "/customer/account";
  const shoppingHref = staffShoppingRedirect(user?.role);

  return (
    <div className="container hidden min-w-0 items-center gap-4 py-2 lg:flex xl:gap-6">
      {/* 1. Logo */}
      <div className="flex h-9 w-[120px] shrink-0 items-center xl:w-[130px]">
        <Link prefetch={false}
          href="/"
          className="relative block h-9 w-full"
          aria-label={`${store.name} Home`}
        >
          <Image
            src={store.logoUrl || SITE_LOGO}
            alt={store.name}
            unoptimized={Boolean(store.logoUrl && !isCloudinaryUrl(store.logoUrl))}
            fill
            priority
            sizes="120px"
            className="object-contain object-left"
          />
        </Link>
      </div>

      {/* 2. Search Bar */}
      <div className="min-w-0 flex-1">
        <div className="flex h-12 items-center rounded-sm border border-gray-200">
          {/* Category Selector */}
          <div
            onPointerEnter={() => setCategoryMenuReady(true)}
            onFocusCapture={() => setCategoryMenuReady(true)}
            className="group/cat relative h-full w-[140px] min-w-0 shrink-0 border-r border-gray-200 bg-white xl:w-[180px]"
          >
            <button
              type="button"
              className="flex h-full w-full items-center justify-between px-4 text-sm font-medium text-foreground"
            >
              <span className="truncate">{selectedCatName}</span>

              <ChevronDown
                size={14}
                className="transition-transform duration-200 group-hover/cat:rotate-180"
              />
            </button>

            {categoryMenuReady && <CategoryMegaMenu categories={categories ?? []} onSelect={setSelectedCatName} />}
          </div>

          {/* Search Input */}
          <div className="relative z-50 min-w-0 flex-1">
            <SearchBox />
          </div>
        </div>
      </div>

      {/* 3. Right Icons & Actions */}
      <div className="flex shrink-0 items-center gap-2 xl:gap-4">
        {/* Wishlist */}
        <Link prefetch={false}
          href={shoppingHref ?? "/customer/wish-list"}
          className="group relative flex items-center gap-2"
          aria-label={wishBadge.loading ? "Wishlist, loading item count" : `Wishlist, ${wishBadge.count} items`}
        >
          <div className="relative p-2">
            <Heart
              size={24}
              className="text-foreground transition-colors group-hover:text-primary"
            />

            <NavbarCountBadge {...wishBadge} className="right-0 top-1" />
          </div>
        </Link>

        {/* Cart */}
        <Link prefetch={false} href={shoppingHref ?? "/cart"} className="group flex items-center gap-3"
          aria-label={cartBadge.loading ? "Cart, loading item count" : `Cart, ${cartBadge.count} items`}>
          <div className="relative p-2">
            <ShoppingBag
              size={24}
              className="text-foreground transition-colors group-hover:text-primary"
            />

            <NavbarCountBadge {...cartBadge} className="right-0 top-1" />
          </div>
        </Link>

        {actions}

        {/* Account */}
        <div className="group min-w-0 shrink-0 cursor-pointer xl:w-[200px] xl:border-r xl:border-gray-100 xl:pr-6">
          {showSessionPlaceholder ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />

              <div className="hidden w-full flex-col gap-1.5 xl:flex">
                <div className="h-2 w-10 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ) : user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="flex w-full shrink-0 items-center gap-3 text-left focus:outline-none">
                <UserAvatar
                  src={user.image}
                  name={user.name}
                  className="h-9 w-9 shrink-0"
                  iconSize={22}
                />

                <div className="hidden min-w-0 flex-col items-start truncate xl:flex">
                  <span className="text-xs leading-snug text-gray-500">Welcome</span>

                  <span className="w-full truncate text-sm font-medium capitalize text-foreground">
                    {user.name || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="mt-2 w-44 rounded-none border border-gray-100 bg-white">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary hover:text-white"
                >
                  <Link prefetch={false} href={getAccountHref()}>
                    {staffDashboardPath(user?.role) ? "Dashboard" : "My Account"}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer hover:bg-primary hover:text-white"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link prefetch={false} href="/login" className="flex w-full shrink-0 items-center gap-3">
              <UserAvatar className="h-10 w-10 shrink-0" iconSize={22} />

              <div className="hidden min-w-0 flex-col items-start truncate text-left xl:flex">
                <span className="text-xs leading-snug text-gray-500">Welcome</span>

                <span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  Sign in/Register
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeskTopNavbar;

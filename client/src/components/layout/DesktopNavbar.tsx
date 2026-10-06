"use client";

import { ChevronDown, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import SearchBox from "@/components/shared/SearchBox";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryMegaMenu from "@/features/catalog/components/category/CategoryMegaMenu";
import { CategoryListItem } from "@/features/catalog/types";
import { successToast } from "@/helpers";
import { useHydratedStore } from "@/hooks/useHydratedStore";
import { authClient } from "@/lib/api/auth/auth-client";
import { useCartStore } from "@/stores/useCartStore";
import { useWishStore } from "@/stores/useWishStore";

const DeskTopNavbar = ({ categories }: { categories: CategoryListItem[] }) => {
  const cartCount = useHydratedStore(useCartStore, (s) => s.cartCount, 0);
  const wishCount = useHydratedStore(useWishStore, (s) => s.wishCount, 0);
  const router = useRouter();

  const [selectedCatName, setSelectedCatName] = useState("All Categories");

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

  // Safe dashboard redirect depending on user role
  const getAccountHref = () => {
    if (user?.role === "ADMIN") return "/admin";
    if (user?.role === "VENDOR") return "/vendor";
    return "/customer/account";
  };

  return (
    <div className="container hidden min-w-0 items-center justify-between gap-4 py-2 lg:flex xl:gap-8">
      {/* 1. Logo */}
      <div className="shrink-0 md:w-40">
        <Link href="/">
          <Image
            src="https://res.cloudinary.com/dw0ojh7h8/image/upload/v1791296117/logo_a9k7te.png"
            alt="Logo"
            width={150}
            height={80}
            style={{ width: "auto", height: "auto" }} // <-- Add this to fix the warning
            className="h-8 w-auto" // Your scaling classes
          />
        </Link>
      </div>

      {/* 2. Integrated Search Bar with Hoverable Category Dropdown */}
      <div className="max-w-2xl min-w-0 flex-1">
        <div className="flex h-12 items-center rounded-sm border border-gray-200">
          {/* Custom Category Selector */}
          <div className="group/cat relative h-full w-[140px] min-w-0 shrink-0 border-r border-gray-200 bg-white xl:w-[180px]">
            <button
              type="button"
              className="flex h-full w-full items-center justify-between px-4 text-sm font-medium text-secondary"
            >
              <span className="truncate">{selectedCatName}</span>
              <ChevronDown
                size={14}
                className="transition-transform duration-200 group-hover/cat:rotate-180"
              />
            </button>
            <CategoryMegaMenu categories={categories ?? []} onSelect={setSelectedCatName} />
          </div>

          {/* Search Input Area */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <SearchBox />
          </div>
        </div>
      </div>

      {/* 3. Right Icons & Actions */}
      <div className="flex shrink-0 items-center gap-2 xl:gap-4">
        {/* Wishlist */}
        <Link href="/customer/wish-list" className="group relative flex items-center gap-2">
          <div className="relative p-2">
            <Heart
              size={24}
              className="text-secondary transition-colors group-hover:text-primary"
            />
            <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {String(wishCount).padStart(2, "0")}
            </span>
          </div>
        </Link>

        {/* My Cart */}
        <Link href="/cart" className="group flex items-center gap-3">
          <div className="relative p-2">
            <ShoppingCart
              size={24}
              className="text-secondary transition-colors group-hover:text-primary"
            />
            <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {String(cartCount).padStart(2, "0")}
            </span>
          </div>
        </Link>

        {/* Account Dropdown or Sign In */}
        <div className="group shrink-0 cursor-pointer min-w-0 xl:w-[200px] xl:border-r xl:border-gray-100 xl:pr-6">
          {showSessionPlaceholder ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="hidden flex-col gap-1.5 xl:flex w-full">
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
                  className="h-10 w-10 shrink-0"
                  iconSize={22}
                />
                <div className="hidden min-w-0 flex-col items-start truncate xl:flex">
                  <span className="text-[11px] leading-none text-gray-500">Welcome</span>
                  <span className="w-full truncate text-sm font-bold capitalize text-secondary">
                    {user.name || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="mt-2 w-44 rounded-none border border-gray-100 bg-white">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer hover:bg-primary hover:text-white"
                >
                  <Link href={getAccountHref()}>
                    {user?.role === "ADMIN" ? "Dashboard" : "My Account"}
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
            <Link href="/login" className="flex w-full shrink-0 items-center gap-3">
              <UserAvatar className="h-10 w-10 shrink-0" iconSize={22} />
              <div className="hidden min-w-0 flex-col items-start truncate text-left xl:flex">
                <span className="text-[12px] leading-none text-gray-500">Welcome</span>
                <span className="truncate text-sm font-bold text-secondary transition-colors group-hover:text-primary">
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

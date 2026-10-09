"use client";

import SearchDrawer from "@/components/shared/Search.drawer";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileCategoryItem from "@/features/catalog/components/category/MobileCategory";
import { CategoryListItem } from "@/features/catalog/types";
import { successToast } from "@/helpers";
import { authClient } from "@/lib/api/auth/auth-client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleUserRound, Globe, LogOut, Search, TextAlignJustify, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";

// Safe hydration check without useEffect
const emptySubscribe = () => () => {};

const useIsHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

const getUserDashboardUrl = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "VENDOR":
      return "/vendor";
    default:
      return "/customer/account";
  }
};

interface MobileNavbarProps {
  categories: CategoryListItem[];
}

const MobileNavbar = ({ categories }: MobileNavbarProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("English");

  const isHydrated = useIsHydrated();
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  const showSessionPlaceholder = !isHydrated || isPending;

  const toggleDrawer = (isOpen: boolean) => {
    setOpen(isOpen);

    if (typeof window !== "undefined") {
      document.body.classList.toggle("overflow-hidden", isOpen);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toggleDrawer(false);
          router.push("/login");
          successToast("Logout successful!");
        },
      },
    });
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <div className="border-b border-gray-100 bg-white shadow-sm lg:hidden">
      <div className="container flex min-w-0 items-center justify-between gap-2 py-3">
        {/* Left Menu Button */}
        <button
          type="button"
          onClick={() => toggleDrawer(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-left rounded-md bg-white text-slate-700 transition-colors hover:text-primary"
          aria-label="Open navigation menu"
        >
          <TextAlignJustify size={22} strokeWidth={1.7} />
        </button>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <button
            type="button"
            onClick={() => setSearchDrawerOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 transition-colors hover:bg-gray-50 hover:text-primary"
            aria-label="Open search"
          >
            <Search size={22} strokeWidth={1.7} />
          </button>

          {/* Profile */}
          {showSessionPlaceholder ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white">
              <span className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
            </div>
          ) : user ? (
            <Link
              href={getUserDashboardUrl(user.role as string)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-50"
              aria-label="View user profile"
            >
              <UserAvatar src={user.image} name={user.name} className="h-8 w-8" iconSize={18} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-700 transition-colors hover:border-primary hover:bg-gray-50 hover:text-primary"
              aria-label="Sign in"
            >
              <CircleUserRound size={22} strokeWidth={1.7} />
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[10000] h-dvh overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                toggleDrawer(false);
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
              onClick={() => toggleDrawer(false)}
            />

            {/* Sidebar */}
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
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-gray-100 p-5">
                {/* Drawer Logo */}
                <div className="flex h-8 w-[120px] items-center overflow-hidden">
                  <Link
                    href="/"
                    onClick={() => toggleDrawer(false)}
                    className="relative block h-8 w-full"
                  >
                    <Image
                      src="https://res.cloudinary.com/dw0ojh7h8/image/upload/v1791311194/logo_oqjaqh.png"
                      alt="Ayra"
                      fill
                      sizes="120px"
                      priority
                      className="object-contain object-left"
                    />
                  </Link>
                </div>

                {/* Close */}
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                  onClick={() => toggleDrawer(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                {/* User */}
                {user && (
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-slate-50 p-5">
                    <UserAvatar
                      src={user.image}
                      name={user.name}
                      className="h-10 w-10"
                      iconSize={20}
                    />

                    <Link
                      href={getUserDashboardUrl(user.role as string)}
                      onClick={() => toggleDrawer(false)}
                      className="text-sm font-bold uppercase tracking-tight text-slate-900 hover:underline"
                    >
                      {user.role === "ADMIN" ? "Dashboard" : "My Account"}
                    </Link>
                  </div>
                )}

                {/* Categories */}
                <ul className="flex flex-col text-slate-800">
                  <li className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Collections
                  </li>

                  {categories?.map((category) => (
                    <MobileCategoryItem
                      key={category.id}
                      category={category}
                      onNavigate={() => toggleDrawer(false)}
                    />
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="space-y-4 border-t border-gray-100 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
                {/* Region */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Globe size={16} />

                    <span className="text-xs font-bold uppercase tracking-wider">Region</span>
                  </div>

                  <Select value={language} onValueChange={(val) => setLanguage(val)}>
                    <SelectTrigger className="h-11 w-[120px] border-none bg-slate-100 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Image
                          src={
                            language === "English" ? "/images/icon/en.png" : "/images/icon/bn.png"
                          }
                          alt={`${language} flag icon`}
                          width={16}
                          height={16}
                        />

                        <SelectValue />
                      </div>
                    </SelectTrigger>

                    <SelectContent className="z-[10001] bg-white">
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Bangla">Bangla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auth */}
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold tracking-wide text-white transition-all active:scale-95"
                  >
                    <LogOut size={18} />
                    LOGOUT
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => toggleDrawer(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    <CircleUserRound size={18} />
                    LOGIN / SIGNUP
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {searchDrawerOpen && <SearchDrawer onClose={() => setSearchDrawerOpen(false)} />}
      </Suspense>
    </div>
  );
};

export default MobileNavbar;

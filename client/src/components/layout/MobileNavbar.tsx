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

  // Imperative toggle handlers (eliminates useEffect for overflow control)
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
    <div className="lg:hidden bg-white border-b border-gray-100 shadow-sm">
      <div className="container flex min-w-0 items-center justify-between gap-2 py-3">
        <button
          onClick={() => toggleDrawer(true)}
          className="min-h-11 min-w-11 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <TextAlignJustify size={22} strokeWidth={1.7} />
        </button>

        <div className="shrink-0">
          <Link href="/">
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={120}
              height={40}
              style={{ width: "auto", height: "auto" }} // <-- Add this to fix the warning
              className="h-8 w-auto" // Your scaling classes
            />
          </Link>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setSearchDrawerOpen(true)}
            className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open search"
          >
            <Search size={22} strokeWidth={1.7} />
          </button>

          {showSessionPlaceholder ? (
            <span className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <Link
              href={getUserDashboardUrl(user.role as string)}
              className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="View user profile"
            >
              <UserAvatar src={user.image} name={user.name} className="h-8 w-8" iconSize={18} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="h-11 w-11 flex items-center justify-center text-slate-700 hover:text-primary transition-colors"
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
              if (e.key === "Escape") toggleDrawer(false);
            }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={backdropVariants}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={() => toggleDrawer(false)}
            />

            {/* Sidebar Content */}
            <motion.div
              className="absolute top-0 left-0 flex h-dvh max-h-dvh w-[min(88%,24rem)] max-w-sm flex-col bg-white shadow-2xl"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", damping: 25, stiffness: 200 }
              }
            >
              <div className="flex justify-between items-center p-5 border-b">
                <div className="shrink-0">
                  <Link href="/" onClick={() => toggleDrawer(false)}>
                    <Image
                      src="/images/logo/logo.png"
                      alt="Logo"
                      width={120}
                      height={40}
                      style={{ width: "auto", height: "auto" }} // <-- Add this to fix the warning
                      className="h-8 w-auto" // Your scaling classes
                    />
                  </Link>
                </div>
                <button
                  className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-black transition-colors"
                  onClick={() => toggleDrawer(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar">
                {user && (
                  <div className="bg-slate-50 p-5 border-b flex items-center gap-3">
                    <UserAvatar
                      src={user.image}
                      name={user.name}
                      className="h-10 w-10"
                      iconSize={20}
                    />
                    <Link
                      href={getUserDashboardUrl(user.role as string)}
                      onClick={() => toggleDrawer(false)}
                      className="font-bold text-sm text-slate-900 uppercase tracking-tight hover:underline"
                    >
                      {user.role === "ADMIN" ? "Dashboard" : "My Account"}
                    </Link>
                  </div>
                )}

                <ul className="flex flex-col text-slate-800">
                  <li className="px-5 pt-6 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
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

              <div className="space-y-4 border-t p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Globe size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Region</span>
                  </div>
                  <Select value={language} onValueChange={(val) => setLanguage(val)}>
                    <SelectTrigger className="w-[120px] h-11 border-none bg-slate-100 font-bold text-xs">
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

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-all"
                  >
                    <LogOut size={18} />
                    LOGOUT
                  </button>
                ) : (
                  <Link
                    onClick={() => toggleDrawer(false)}
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-all"
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

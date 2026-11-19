"use client";

import DeskTopNavbar from "@/components/layout/DesktopNavbar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { CategoryListItem } from "@/features/catalog/types";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { authClient } from "@/lib/api/auth/auth-client";
import { normalizeRole } from "@/lib/api/auth/roles";

export default function Navbar({ categories, initialIsCustomer }: {
  categories: CategoryListItem[];
  initialIsCustomer: boolean;
}) {
  const { data, isPending } = authClient.useSession();
  const isCustomer = data?.user
    ? normalizeRole(data.user.role) === "CUSTOMER"
    : isPending && initialIsCustomer;
  const actions = isCustomer ? (
    <NotificationBell
      viewAllHref="/customer/notifications"
      badgeClassName="-right-0.5 -top-0.5 lg:right-0 lg:top-1"
      className="size-11 lg:size-10 shrink-0 rounded-full border-0 bg-transparent shadow-none outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:bg-accent [&_svg]:size-5"
    />
  ) : null;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <MobileNavbar actions={actions} />
      <DeskTopNavbar categories={categories} actions={actions} initialIsCustomer={initialIsCustomer} />
    </nav>
  );
}

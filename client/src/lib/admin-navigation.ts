import {
  Building2,
  CircleHelp,
  CreditCard,
  FolderTree,
  Images,
  LayoutDashboard,
  Mail,
  Newspaper,
  Package,
  PackageCheck,
  RotateCcw,
  Scale,
  ScrollText,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Tags,
  TicketPercent,
  Truck,
  Undo2,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import {
  hasAdminPermission,
  type AdminAccess,
  type AdminPermission,
} from "@/lib/admin-permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  permission?: AdminPermission;
};

export type AdminNavGroup = {
  id: string;
  label?: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "overview",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: LayoutDashboard,
        exact: true,
        permission: "analytics",
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      {
        href: "/admin/orders",
        label: "Orders",
        icon: ShoppingCart,
        permission: "orders",
      },
      {
        href: "/admin/payments",
        label: "Payments",
        icon: CreditCard,
        permission: "orders",
      },
      {
        href: "/admin/returns",
        label: "Returns",
        icon: Undo2,
        permission: "orders",
      },
      {
        href: "/admin/refunds",
        label: "Refunds",
        icon: RotateCcw,
        permission: "orders",
      },
      {
        href: "/admin/shipments",
        label: "Shipments",
        icon: PackageCheck,
        permission: "orders",
      },
      {
        href: "/admin/shipping",
        label: "Shipping settings",
        icon: Truck,
        permission: "shipping",
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
        permission: "catalog",
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: FolderTree,
        permission: "catalog",
      },
      {
        href: "/admin/brands",
        label: "Brands",
        icon: Tag,
        permission: "catalog",
      },
      {
        href: "/admin/attributes",
        label: "Attributes",
        icon: Tags,
        permission: "catalog",
      },
      {
        href: "/admin/inventory",
        label: "Inventory",
        icon: Building2,
        permission: "inventory",
      },
      {
        href: "/admin/warehouses",
        label: "Warehouses",
        icon: Warehouse,
        permission: "inventory",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        permission: "customers",
      },
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: TicketPercent,
        permission: "marketing",
      },
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: Star,
        permission: "marketing",
      },
    ],
  },
  {
    id: "site",
    label: "Site",
    items: [
      {
        href: "/admin/sliders",
        label: "Sliders",
        icon: Images,
        permission: "content",
      },
      {
        href: "/admin/blogs",
        label: "Blogs",
        icon: Newspaper,
        permission: "content",
      },
      {
        href: "/admin/faqs",
        label: "FAQs",
        icon: CircleHelp,
        permission: "content",
      },
      {
        href: "/admin/contact",
        label: "Contact messages",
        icon: Mail,
        permission: "content",
      },
      {
        href: "/admin/legal",
        label: "Legal",
        icon: Scale,
        permission: "content",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        href: "/admin/staff",
        label: "Staff",
        icon: UserCog,
        permission: "staff",
      },
      {
        href: "/admin/audit-log",
        label: "Audit log",
        icon: ScrollText,
        permission: "audit",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        permission: "settings",
      },
    ],
  },
];
export function getAdminNavItems(): AdminNavItem[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items);
}

export function canAccessAdminItem(
  access: AdminAccess | unknown,
  item: AdminNavItem,
): boolean {
  return !item.permission || hasAdminPermission(access, item.permission);
}

export function getVisibleAdminNavGroups(
  access: AdminAccess | unknown,
): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessAdminItem(access, item)),
  })).filter((group) => group.items.length > 0);
}

export function getFirstPermittedAdminHref(
  access: AdminAccess | unknown,
): string | null {
  for (const item of getAdminNavItems()) {
    if (canAccessAdminItem(access, item)) return item.href;
  }
  return null;
}

export function isAdminNavItemActive(
  item: AdminNavItem,
  pathname: string,
): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findAdminNavItemByPath(
  pathname: string,
): AdminNavItem | undefined {
  return [...getAdminNavItems()]
    .filter((item) => isAdminNavItemActive(item, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function canAccessAdminPath(
  access: AdminAccess | unknown,
  pathname: string,
): boolean {
  const item = findAdminNavItemByPath(pathname);
  return item ? canAccessAdminItem(access, item) : false;
}

export function resolveAdminRedirect(
  access: AdminAccess | unknown,
  pathname: string,
): string | null {
  if (canAccessAdminPath(access, pathname)) return null;

  const destination = getFirstPermittedAdminHref(access);
  if (!destination || destination === pathname) return "/unauthorized";
  return destination;
}

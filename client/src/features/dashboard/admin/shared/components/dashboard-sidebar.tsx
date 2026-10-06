"use client";

import {
  Building2,
  CircleHelp,
  CreditCard,
  FolderTree,
  Images,
  LayoutDashboard,
  Newspaper,
  Package,
  Scale,
  ShoppingCart,
  Star,
  Store,
  Tags,
  TicketPercent,
  Truck,
  Undo2,
  User,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/attributes", label: "Attributes", icon: Tags },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/sliders", label: "Sliders", icon: Images },
  { href: "/admin/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/inventory", label: "Inventory", icon: Building2 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/legal", label: "Legals", icon: Scale },
  { href: "/admin/faqs", label: "FAQs", icon: CircleHelp },
  { href: "/admin/blogs", label: "Blogs", icon: Newspaper },
];

const VENDOR_NAV: NavItem[] = [
  { href: "/vendor", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/vendor/profile", label: "Shop profile", icon: User },
];

function navFor(pathname: string): { title: string; home: string; items: NavItem[] } {
  if (pathname.startsWith("/vendor")) {
    return { title: "Ayra", home: "/vendor", items: VENDOR_NAV };
  }
  return { title: "Ayra", home: "/admin", items: ADMIN_NAV };
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { title, home, items } = navFor(pathname);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link href={home} className="flex items-center gap-2 px-1">
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            A
          </span>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {title}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

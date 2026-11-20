"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { usePublicSettings } from "@/features/settings/public-settings-provider";
import {
  getVisibleAdminNavGroups,
  isAdminNavItemActive,
} from "@/lib/admin-navigation";
import type { AdminAccess } from "@/lib/admin-permissions";

const NO_ACCESS: AdminAccess = {
  role: "ADMIN",
  isSuperAdmin: false,
  adminPermissions: [],
  adminActions: [],
  staffStatus: "ACTIVE",
};

export function DashboardSidebar({
  access = NO_ACCESS,
  homeHref = "/admin",
}: {
  access?: AdminAccess;
  homeHref?: string;
}) {
  const { store } = usePublicSettings();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const groups = getVisibleAdminNavGroups(access);
  const [prefetchIntentHref, setPrefetchIntentHref] = useState<string | null>(
    null,
  );

  const handleNavigate = () => {
    setOpenMobile(false);
  };

  const handlePrefetchIntent = (href: string) => {
    setPrefetchIntentHref(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link
          href={homeHref}
          onClick={() => handleNavigate()}
          className="flex items-center gap-2 px-1"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            A
          </span>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {store.name}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {groups.map((group) => (
          <SidebarGroup key={group.id} className="px-2 py-1">
            {group.label ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isAdminNavItemActive(item, pathname);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          prefetch={
                            prefetchIntentHref === item.href
                          }
                          onMouseEnter={() => handlePrefetchIntent(item.href)}
                          onFocus={() => handlePrefetchIntent(item.href)}
                          onClick={handleNavigate}
                          aria-current={active ? "page" : undefined}
                        >
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

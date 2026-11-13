"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  fetchBlogCategories,
  fetchBlogList,
} from "@/features/dashboard/admin/blogs/api/blogs";
import {
  fetchFaqCategories,
  fetchFaqItems,
} from "@/features/dashboard/admin/faqs/api/faqs";
import { fetchLegalList } from "@/features/dashboard/admin/legal/api/legal";
import {
  fetchShippingMethods,
  fetchShippingRates,
  fetchShippingZones,
} from "@/features/dashboard/admin/shipping/api/shipping";
import {
  ADMIN_SETTINGS_QUERY_KEY,
  fetchAdminSettings,
} from "@/features/dashboard/admin/settings/api/settings";
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

const TAB_PREFETCH_STALE_TIME = 30_000;

function prefetchAdminTabData(queryClient: QueryClient, href: string) {
  switch (href) {
    case "/admin/blogs":
      void Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["admin-blogs", 1, "", "", ""],
          queryFn: () => fetchBlogList({ page: 1, limit: 20 }),
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
        queryClient.prefetchQuery({
          queryKey: ["admin-blog-categories"],
          queryFn: fetchBlogCategories,
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
      ]);
      break;
    case "/admin/shipping":
      void Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["admin-shipping-zones"],
          queryFn: fetchShippingZones,
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
        queryClient.prefetchQuery({
          queryKey: ["admin-shipping-methods"],
          queryFn: fetchShippingMethods,
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
        queryClient.prefetchQuery({
          queryKey: ["admin-shipping-rates"],
          queryFn: fetchShippingRates,
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
      ]);
      break;
    case "/admin/legal":
      void queryClient.prefetchQuery({
        queryKey: ["admin-legal", 1, ""],
        queryFn: () => fetchLegalList({ page: 1, limit: 20 }),
        staleTime: TAB_PREFETCH_STALE_TIME,
      });
      break;
    case "/admin/faqs":
      void Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["admin-faq-categories"],
          queryFn: fetchFaqCategories,
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
        queryClient.prefetchQuery({
          queryKey: ["admin-faq-items", ""],
          queryFn: () => fetchFaqItems(),
          staleTime: TAB_PREFETCH_STALE_TIME,
        }),
      ]);
      break;
    case "/admin/settings":
      void queryClient.prefetchQuery({
        queryKey: ADMIN_SETTINGS_QUERY_KEY,
        queryFn: fetchAdminSettings,
        staleTime: TAB_PREFETCH_STALE_TIME,
      });
      break;
  }
}

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
  const queryClient = useQueryClient();
  const groups = getVisibleAdminNavGroups(access);
  const [prefetchIntentHref, setPrefetchIntentHref] = useState<string | null>(
    null,
  );

  const handleNavigate = (href?: string) => {
    setOpenMobile(false);
    if (href) prefetchAdminTabData(queryClient, href);
  };

  const handlePrefetchIntent = (href: string) => {
    setPrefetchIntentHref(href);
    prefetchAdminTabData(queryClient, href);
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
                            prefetchIntentHref === item.href ? true : "auto"
                          }
                          onMouseEnter={() => handlePrefetchIntent(item.href)}
                          onFocus={() => handlePrefetchIntent(item.href)}
                          onClick={() => handleNavigate(item.href)}
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

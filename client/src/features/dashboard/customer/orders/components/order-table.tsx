"use client";

import { useOrderList } from "@/features/dashboard/customer/orders/hooks/use-order-list";
import type { OrderTableProps } from "@/features/dashboard/customer/orders/types";
import { statusColor } from "@/helpers";
import clsx from "clsx";
import { Calendar, Eye, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function OrderTable({ initialData }: OrderTableProps) {
  const { query, items } = useOrderList({
    initialData,
    page: initialData.pagination.page,
  });
  const loading = query.isFetching && items.length === 0;
  const orders = items;

  return (
    <div className="bg-card">
      <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
            My Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your recent purchases
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-muted p-3 text-primary">
          <ShoppingBag size={24} />
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Order #
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Total
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-4 bg-muted rounded w-24" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-muted rounded w-20" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-muted rounded w-16" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-7 bg-muted rounded-full w-20" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="h-8 bg-muted rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              : orders?.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted transition-colors group"
                  >
                    <td className="px-6 py-5 font-bold text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </td>
                    <td className="px-6 py-5 font-semibold tabular-nums text-foreground">
                      Tk {order.grandTotal}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                          statusColor(order.status),
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/customer/orders/view-order/${order.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-muted-foreground rounded-lg text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                      >
                        <Eye size={14} />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse space-y-4 rounded-xl border border-border p-4 sm:p-5"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded-full w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          : orders?.map((order) => (
              <div
                key={order.id}
                className="space-y-4 rounded-xl border border-border p-4 shadow-sm sm:p-5"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Order ID
                    </span>
                    <h4 className="font-bold text-foreground truncate">
                      {order.orderNumber}
                    </h4>
                  </div>
                  <span
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap",
                      statusColor(order.status),
                    )}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-y border-border text-sm gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <Calendar size={14} />
                    <span className="truncate">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="font-bold text-foreground whitespace-nowrap">
                    Tk {order.grandTotal}
                  </div>
                </div>

                <Link
                  href={`/customer/orders/view-order/${order.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-muted text-foreground text-sm font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  <Eye size={16} />
                  View Order Details
                </Link>
              </div>
            ))}
      </div>

      {!loading && orders?.length === 0 && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-muted py-16 text-center md:py-20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-sm">
            <Package className="text-muted-foreground/60" size={32} aria-hidden />
          </div>
          <h3 className="text-lg font-bold text-foreground">No orders found</h3>
          <p className="mx-auto mt-2 max-w-[240px] text-sm text-muted-foreground">
            Looks like you haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}

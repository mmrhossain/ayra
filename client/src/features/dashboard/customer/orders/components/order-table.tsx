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
    <div className="bg-white">
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            My Orders
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage your recent purchases
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl text-primary">
          <ShoppingBag size={24} />
        </div>
      </div>

      <div className="hidden md:block overflow-hidden border border-slate-100 rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Order #
              </th>
              <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Date
              </th>
              <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Total
              </th>
              <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="text-right px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-7 bg-slate-100 rounded-full w-20" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              : orders?.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5 font-bold text-slate-700">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-5 text-slate-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-900">
                      Tk {order.grandTotal}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                          statusColor(order.status),
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/customer/orders/view-order/${order.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
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

      <div className="md:hidden space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-100 rounded w-24" />
                  <div className="h-6 bg-slate-100 rounded-full w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))
          : orders?.map((order) => (
              <div
                key={order.id}
                className="border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Order ID
                    </span>
                    <h4 className="font-bold text-slate-900 truncate">
                      {order.orderNumber}
                    </h4>
                  </div>
                  <span
                    className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                      statusColor(order.status),
                    )}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-y border-slate-50 text-sm gap-3">
                  <div className="flex items-center gap-2 text-slate-500 min-w-0">
                    <Calendar size={14} />
                    <span className="truncate">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 whitespace-nowrap">
                    Tk {order.grandTotal}
                  </div>
                </div>

                <Link
                  href={`/customer/orders/view-order/${order.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                >
                  <Eye size={16} />
                  View Order Details
                </Link>
              </div>
            ))}
      </div>

      {!loading && orders?.length === 0 && (
        <div className="text-center py-16 md:py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Package className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
          <p className="text-slate-500 text-sm max-w-[240px] mx-auto mt-2">
            Looks like you haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-6 px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}

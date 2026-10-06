"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyOrder } from "@/features/dashboard/customer/orders/api/orders";
import type { CustomerOrder } from "@/features/dashboard/customer/orders/types";

export function useOrderDetail({
  orderId,
  initialData,
}: {
  orderId: string;
  initialData: CustomerOrder;
}) {
  const query = useQuery({
    queryKey: ["customer-order", orderId],
    queryFn: () => fetchMyOrder(orderId),
    initialData,
    staleTime: 30_000,
  });

  return { query, order: query.data ?? initialData };
}

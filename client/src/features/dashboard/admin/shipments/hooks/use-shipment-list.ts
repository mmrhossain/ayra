"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchShipmentList } from "@/features/dashboard/admin/shipments/api/shipments";
import type {
  CourierProvider,
  ShipmentListResult,
  ShipmentStatus,
} from "@/features/dashboard/admin/shipments/types/models";

export const SHIPMENT_PAGE_SIZE = 20;

export function useShipmentList({
  initialData,
  page,
  status,
  courierProvider,
  search,
}: {
  initialData: ShipmentListResult;
  page: number;
  status: ShipmentStatus | "";
  courierProvider: CourierProvider | "";
  search: string;
}) {
  const isDefaultQuery =
    page === 1 && status === "" && courierProvider === "" && search === "";

  const query = useQuery({
    queryKey: ["admin-shipments", page, status, courierProvider, search],
    queryFn: () =>
      fetchShipmentList({
        page,
        limit: SHIPMENT_PAGE_SIZE,
        status: status || undefined,
        courierProvider: courierProvider || undefined,
        search: search || undefined,
      }),
    initialData: isDefaultQuery ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const data = query.data ?? initialData;
  return { query, data, items: data.items, pagination: data.pagination };
}

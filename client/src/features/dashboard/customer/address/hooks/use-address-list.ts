"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMyAddresses } from "@/features/dashboard/customer/address/api/addresses";
import type { SavedAddress } from "@/features/dashboard/customer/address/types";

export function useAddressList({
  initialData,
}: {
  initialData: SavedAddress[];
}) {
  const query = useQuery({
    queryKey: ["customer-addresses"],
    queryFn: fetchMyAddresses,
    initialData,
    staleTime: 30_000,
  });

  return {
    query,
    addresses: query.data ?? initialData,
  };
}

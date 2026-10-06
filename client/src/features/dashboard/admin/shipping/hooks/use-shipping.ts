"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchShippingMethods,
  fetchShippingRates,
  fetchShippingZones,
  updateShippingMethod,
  updateShippingZone,
} from "@/features/dashboard/admin/shipping/api/shipping";
import type {
  ShippingMethod,
  ShippingRate,
  ShippingZone,
} from "@/features/dashboard/admin/shipping/types";
import { toShippingErrorMessage } from "@/features/dashboard/admin/shipping/utils";

export function useShipping({
  initialZones,
  initialMethods,
  initialRates,
}: {
  initialZones: ShippingZone[];
  initialMethods: ShippingMethod[];
  initialRates: ShippingRate[];
}) {
  const queryClient = useQueryClient();

  const zonesQuery = useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: fetchShippingZones,
    initialData: initialZones,
    staleTime: 30_000,
  });
  const methodsQuery = useQuery({
    queryKey: ["admin-shipping-methods"],
    queryFn: fetchShippingMethods,
    initialData: initialMethods,
    staleTime: 30_000,
  });
  const ratesQuery = useQuery({
    queryKey: ["admin-shipping-rates"],
    queryFn: fetchShippingRates,
    initialData: initialRates,
    staleTime: 30_000,
  });

  const toggleZone = useMutation({
    mutationFn: (zone: ShippingZone) =>
      updateShippingZone(zone.id, { isActive: !zone.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      toast.success("Zone updated");
    },
    onError: (err) => toast.error(toShippingErrorMessage(err)),
  });

  const toggleMethod = useMutation({
    mutationFn: (method: ShippingMethod) =>
      updateShippingMethod(method.id, { isActive: !method.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-methods"] });
      toast.success("Method updated");
    },
    onError: (err) => toast.error(toShippingErrorMessage(err)),
  });

  return {
    zonesQuery,
    methodsQuery,
    ratesQuery,
    zones: zonesQuery.data ?? initialZones,
    methods: methodsQuery.data ?? initialMethods,
    rates: ratesQuery.data ?? initialRates,
    toggleZone,
    toggleMethod,
  };
}

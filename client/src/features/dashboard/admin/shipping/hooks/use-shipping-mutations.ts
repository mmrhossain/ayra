"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createShippingMethod,
  createShippingRate,
  createShippingZone,
  deleteShippingRate,
  deleteShippingZone,
  updateShippingMethod,
  updateShippingRate,
  updateShippingZone,
} from "@/features/dashboard/admin/shipping/api/shipping";
import type {
  ShippingMethodFormValues,
  ShippingRateFormValues,
  ShippingZoneFormValues,
} from "@/features/dashboard/admin/shipping/schemas";
import type {
  DialogMode,
  ShippingMethod,
  ShippingRate,
  ShippingZone,
} from "@/features/dashboard/admin/shipping/types";
import { toShippingErrorMessage } from "@/features/dashboard/admin/shipping/utils";

export function useShippingZoneFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: ShippingZone;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ShippingZoneFormValues) => {
      const body = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        isActive: values.isActive,
        isFallback: values.isFallback,
        matchDistricts: values.matchDistricts
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing zone");
        return updateShippingZone(initialData.id, body);
      }
      return createShippingZone(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      toast.success(mode === "edit" ? "Zone updated" : "Zone created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShippingErrorMessage(err));
    },
  });
}

export function useShippingZoneDeleteMutation({
  zone,
  onSuccess,
}: {
  zone: ShippingZone | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!zone) throw new Error("Missing zone");
      await deleteShippingZone(zone.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      toast.success("Zone deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShippingErrorMessage(err));
    },
  });
}

export function useShippingMethodFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: ShippingMethod;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ShippingMethodFormValues) => {
      const body = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        isActive: values.isActive,
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing method");
        return updateShippingMethod(initialData.id, body);
      }
      return createShippingMethod(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      toast.success(mode === "edit" ? "Method updated" : "Method created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShippingErrorMessage(err));
    },
  });
}

export function useShippingRateFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: ShippingRate;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ShippingRateFormValues) => {
      const body = {
        shippingZoneId: values.shippingZoneId,
        shippingMethodId: values.shippingMethodId,
        price: values.price,
        freeShippingFrom: values.freeShippingFrom,
        isActive: values.isActive,
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing rate");
        return updateShippingRate(initialData.id, body);
      }
      return createShippingRate(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      toast.success(mode === "edit" ? "Rate updated" : "Rate created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShippingErrorMessage(err));
    },
  });
}

export function useShippingRateDeleteMutation({
  rate,
  onSuccess,
}: {
  rate: ShippingRate | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!rate) throw new Error("Missing rate");
      await deleteShippingRate(rate.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      toast.success("Rate deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShippingErrorMessage(err));
    },
  });
}

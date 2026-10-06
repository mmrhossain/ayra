"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createWarehouse,
  deleteWarehouse,
  updateWarehouse,
} from "@/features/dashboard/admin/warehouses/api/warehouses";
import type { WarehouseFormValues } from "@/features/dashboard/admin/warehouses/schemas";
import type {
  DialogMode,
  WarehouseListItem,
} from "@/features/dashboard/admin/warehouses/types";
import { toWarehouseErrorMessage } from "@/features/dashboard/admin/warehouses/utils";

export function useWarehouseFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: WarehouseListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: WarehouseFormValues) => {
      const body = {
        name: values.name.trim(),
        code: values.code.trim(),
        country: values.country.trim(),
        city: values.city.trim(),
        addressLine1: values.addressLine1.trim(),
        isActive: values.isActive,
        ...(values.phone ? { phone: values.phone.trim() } : {}),
        ...(values.email ? { email: values.email.trim() } : {}),
        ...(values.state ? { state: values.state.trim() } : {}),
        ...(values.addressLine2 ? { addressLine2: values.addressLine2.trim() } : {}),
      };
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing warehouse");
        return updateWarehouse(initialData.id, body);
      }
      return createWarehouse(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success(mode === "edit" ? "Warehouse updated" : "Warehouse created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toWarehouseErrorMessage(err));
    },
  });
}

export function useWarehouseDeleteMutation({
  warehouse,
  onSuccess,
}: {
  warehouse: WarehouseListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!warehouse) throw new Error("Missing warehouse");
      await deleteWarehouse(warehouse.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success("Warehouse deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toWarehouseErrorMessage(err));
    },
  });
}

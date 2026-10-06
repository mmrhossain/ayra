"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approveInventoryAdjustment,
  createInventoryAdjustment,
} from "@/features/dashboard/admin/inventory/api/inventory";
import type { AdjustFormValues } from "@/features/dashboard/admin/inventory/schemas";
import type { InventoryListItem } from "@/features/dashboard/admin/inventory/types";
import {
  differenceFor,
  toInventoryErrorMessage,
} from "@/features/dashboard/admin/inventory/utils";

export function useStockAdjustMutation({
  item,
  onSuccess,
}: {
  item: InventoryListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AdjustFormValues) => {
      if (!item) throw new Error("Missing inventory row");
      if (values.type !== "set" && values.quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }
      const difference = differenceFor(values.type, values.quantity, item.quantityOnHand);
      if (difference === 0) throw new Error("No quantity change");
      const reason = values.notes?.trim()
        ? `${values.reason}: ${values.notes.trim()}`
        : values.reason;
      const created = await createInventoryAdjustment({
        warehouseId: item.warehouseId,
        variantId: item.variantId,
        difference,
        reason,
      });
      await approveInventoryAdjustment(created.id);
      return item.quantityAvailable + difference;
    },
    onSuccess: (available) => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success(`Stock updated. Available: ${available}`);
      onSuccess();
    },
    onError: (err) => {
      toast.error(toInventoryErrorMessage(err));
    },
  });
}

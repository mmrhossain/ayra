"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { setInventoryStock } from "@/features/dashboard/admin/inventory/api/inventory";
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
      const quantity = Number(values.quantity);
      if (values.type !== "set" && quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }
      const difference = differenceFor(values.type, quantity, item.quantityOnHand);
      if (difference === 0) throw new Error("No quantity change");
      const targetQty = item.quantityOnHand + difference;
      if (targetQty < 0) {
        throw new Error("Adjustment would result in negative inventory");
      }
      const result = await setInventoryStock({
        warehouseId: item.warehouseId,
        items: [{ variantId: item.variantId, targetQty }],
      });
      const applied = result.items[0];
      return applied?.quantityAvailable ?? item.quantityAvailable + difference;
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

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bulkUpdateProducts } from "@/features/dashboard/admin/products/api/products";
import type { BulkProductAction } from "@/features/dashboard/admin/products/types";
import { toErrorMessage } from "@/features/dashboard/admin/products/utils";
import { revalidateStorefrontTags } from "@/lib/api/revalidate";

export function useProductBulkMutation({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: BulkProductAction) =>
      bulkUpdateProducts(action, globalThis.crypto.randomUUID()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      void revalidateStorefrontTags(["home", "products", "product"]);

      if (result.failed.length > 0) {
        toast.warning(
          `${result.affected} updated, ${result.failed.length} could not be changed`,
        );
      } else {
        toast.success(`${result.affected} product(s) updated`);
      }
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(toErrorMessage(err));
    },
  });
}

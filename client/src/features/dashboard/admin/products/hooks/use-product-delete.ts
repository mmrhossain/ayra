"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteProduct } from "@/features/dashboard/admin/products/api/products";
import type { ProductListItem } from "@/features/dashboard/admin/products/types";
import { toErrorMessage } from "@/features/dashboard/admin/products/utils";

export function useProductDeleteMutation({
  product,
  onSuccess,
}: {
  product: ProductListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Missing product");
      await deleteProduct(product.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toErrorMessage(err));
    },
  });
}

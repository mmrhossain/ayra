"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createBrand,
  deleteBrand,
  updateBrand,
} from "@/features/dashboard/admin/brands/api/brands";
import type { BrandFormValues } from "@/features/dashboard/admin/brands/schemas";
import type {
  BrandListItem,
  DialogMode,
} from "@/features/dashboard/admin/brands/types";
import {
  isBrandSlugConflict,
  slugify,
  toBrandDeleteErrorMessage,
  toBrandErrorMessage,
} from "@/features/dashboard/admin/brands/utils";
import { revalidateStorefrontTags } from "@/lib/api/revalidate";

export function useBrandFormMutation({
  mode,
  initialData,
  onSuccess,
  onSlugConflict,
}: {
  mode: DialogMode;
  initialData?: BrandListItem;
  onSuccess: () => void;
  onSlugConflict: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: BrandFormValues) => {
      const slug = values.slug?.trim() || slugify(values.name);
      const body = {
        name: values.name,
        slug: slug || undefined,
        description: values.description || undefined,
        isActive: values.isActive,
        logo: values.logo?.trim() ? values.logo : null,
        logoPublicId: values.logoPublicId?.trim() ? values.logoPublicId : null,
      };

      if (mode === "create") {
        await createBrand(body);
        return;
      }

      if (!initialData?.id) {
        throw new Error("Missing brand id");
      }

      await updateBrand(initialData.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-brands"],
      });
      queryClient.invalidateQueries({
        queryKey: ["brands"],
      });
      void revalidateStorefrontTags(["home", "brands"]);
      toast.success(mode === "create" ? "Brand created" : "Brand updated");
      onSuccess();
    },
    onError: (err) => {
      if (isBrandSlugConflict(err)) {
        onSlugConflict();
        return;
      }
      toast.error(toBrandErrorMessage(err));
    },
  });
}

export function useBrandDeleteMutation({
  brand,
  onSuccess,
}: {
  brand: BrandListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!brand) throw new Error("Missing brand");
      await deleteBrand(brand.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      void revalidateStorefrontTags(["home", "brands"]);
      toast.success("Brand deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toBrandDeleteErrorMessage(err));
    },
  });
}

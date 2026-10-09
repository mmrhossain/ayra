"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createInventoryAdjustment } from "@/features/dashboard/admin/inventory/api/inventory";
import { DashboardApiError } from "@/lib/api/dashboard";
import {
  createProduct,
  createProductVariant,
  deleteProductVariant,
  updateProduct,
  updateProductVariant,
} from "@/features/dashboard/admin/products/api/products";
import type {
  CreateProductBody,
  CreateVariantBody,
  DetailsValues,
  SaveKind,
  VariantRow,
  WizardMode,
} from "@/features/dashboard/admin/products/types";
import {
  toErrorMessage,
  uniqueSku,
} from "@/features/dashboard/admin/products/utils";

export type { SaveKind };

export type SaveInput = {
  mode: WizardMode;
  kind: SaveKind;
  productId?: string;
  existingVariantIds: string[];
  details: DetailsValues;
  variants: VariantRow[];
  warehouseId?: string;
};

export type SaveResult = {
  productId: string;
  variants: VariantRow[];
  failed: boolean;
  slugConflict: boolean;
};

function productBody(
  details: DetailsValues,
  kind: SaveKind,
  hasVariants: boolean,
): CreateProductBody {
  const urls = details.imageUrls ?? [];
  const primary =
    details.primaryImageUrl && urls.includes(details.primaryImageUrl)
      ? details.primaryImageUrl
      : urls[0];
  const images = urls.map((url) => ({
    url,
    isPrimary: url === primary,
  }));
  const status =
    kind === "draft"
      ? "DRAFT"
      : details.status === "ACTIVE" && !hasVariants
        ? "DRAFT"
        : details.status;
  return {
    name: details.name,
    slug: details.slug,
    description: details.description || undefined,
    categoryId: details.categoryId,
    brandId: details.brandId ? details.brandId : null,
    status,
    isFeatured: details.isFeatured,
    images,
  };
}

function variantBody(row: VariantRow): CreateVariantBody {
  return {
    sku: row.sku.trim(),
    price: Number(row.price),
    isDefault: row.isDefault,
    attributeValueIds: row.attributeValueIds.length
      ? row.attributeValueIds
      : undefined,
  };
}

export function useProductSave() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-product"] });
    queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
  };

  const run = async (input: SaveInput): Promise<SaveResult | null> => {
    setPending(true);
    setProgress(null);
    let currentProductId = input.productId ?? productId ?? undefined;
    const rows: VariantRow[] = input.variants.map((row) => ({
      ...row,
      skuError: undefined,
      priceError: undefined,
    }));

    try {
      const body = productBody(input.details, input.kind, rows.length > 0);

      if (!currentProductId) {
        setProgress("Saving product");
        const created = await createProduct(body);
        currentProductId = created.id;
        setProductId(created.id);
      } else {
        setProgress("Saving product");
        await updateProduct(currentProductId, body);
      }

      const defaultIndex = rows.findIndex((row) => row.isDefault);
      const saveOrder = rows.map((_, index) => index);
      if (defaultIndex > 0) {
        saveOrder.splice(defaultIndex, 1);
        saveOrder.push(defaultIndex);
      }

      for (const i of saveOrder) {
        const row = rows[i];
        if (!row) continue;
        if (row.id) {
          setProgress(`Saving ${i + 1}/${rows.length} variants`);
          await updateProductVariant(row.id, variantBody(row));
          continue;
        }
        setProgress(`Saving ${i + 1}/${rows.length} variants`);
        try {
          const created = await createProductVariant(
            currentProductId,
            variantBody(row),
          );
          rows[i] = { ...row, id: created.id };
        } catch (err) {
          if (err instanceof DashboardApiError && err.status === 409) {
            const taken = new Set(
              rows
                .map((item) => item.sku.trim().toLowerCase())
                .filter(Boolean),
            );
            const nextSku = uniqueSku(row.sku, taken);
            try {
              const retried = await createProductVariant(currentProductId, {
                ...variantBody(row),
                sku: nextSku,
              });
              rows[i] = { ...row, id: retried.id, sku: nextSku };
              continue;
            } catch (retryErr) {
              rows[i] = {
                ...row,
                sku: nextSku,
                skuError: toErrorMessage(retryErr),
              };
              setProgress(`Saving ${i + 1}/${rows.length} variants failed`);
              toast.error(toErrorMessage(retryErr));
              invalidate();
              return {
                productId: currentProductId,
                variants: rows,
                failed: true,
                slugConflict: false,
              };
            }
          }
          setProgress(`Saving ${i + 1}/${rows.length} variants failed`);
          toast.error(toErrorMessage(err));
          invalidate();
          return {
            productId: currentProductId,
            variants: rows,
            failed: true,
            slugConflict: false,
          };
        }
      }

      const keptIds = new Set(
        rows.map((row) => row.id).filter((id): id is string => Boolean(id)),
      );
      if (input.mode === "edit") {
        for (const id of input.existingVariantIds) {
          if (!keptIds.has(id)) {
            await deleteProductVariant(id);
          }
        }
      }

      const pendingQty = rows.some((row) => row.initialQty > 0);
      if (pendingQty && !input.warehouseId) {
        toast.error(
          "Variants saved. Set stock in Inventory — no warehouse found.",
        );
      }

      if (input.warehouseId) {
        for (const row of rows) {
          if (row.id && row.initialQty > 0) {
            try {
              await createInventoryAdjustment({
                warehouseId: input.warehouseId,
                variantId: row.id,
                difference: row.initialQty,
                reason: "RESTOCK",
              });
            } catch (err) {
              toast.error(
                `Variants saved. Stock adjustment failed: ${toErrorMessage(err)}`,
              );
            }
          }
        }
      }

      invalidate();
      return {
        productId: currentProductId,
        variants: rows,
        failed: false,
        slugConflict: false,
      };
    } catch (err) {
      const slugConflict =
        err instanceof DashboardApiError &&
        err.status === 409 &&
        /slug/i.test(err.message);
      if (!slugConflict) toast.error(toErrorMessage(err));
      if (slugConflict) {
        return {
          productId: currentProductId ?? "",
          variants: rows,
          failed: true,
          slugConflict: true,
        };
      }
      return currentProductId
        ? {
            productId: currentProductId,
            variants: rows,
            failed: true,
            slugConflict: false,
          }
        : null;
    } finally {
      setPending(false);
      setProgress(null);
    }
  };

  const finish = (
    kind: SaveKind,
    published: boolean,
    variants: VariantRow[],
  ) => {
    const defaultVariant = variants.find((row) => row.isDefault) ?? variants[0];
    const stockHref = defaultVariant?.id
      ? `/admin/inventory?variantId=${defaultVariant.id}`
      : "/admin/inventory";
    const goStock = () => router.push(stockHref);
    if (kind === "draft" || !published) {
      if (!variants.length) {
        toast.success("Product saved as draft. Add variants.");
      } else {
        toast.success("Product saved as draft. Add stock.", {
          action: { label: "Set stock", onClick: goStock },
        });
      }
    } else {
      const pendingStock = variants.some((row) => row.initialQty > 0);
      toast.success(
        pendingStock
          ? "Product published. Stock is waiting for approval."
          : "Product published.",
        pendingStock
          ? undefined
          : { action: { label: "Set stock", onClick: goStock } },
      );
    }
    router.push("/admin/products");
  };

  return { pending, progress, productId, setProductId, run, finish };
}

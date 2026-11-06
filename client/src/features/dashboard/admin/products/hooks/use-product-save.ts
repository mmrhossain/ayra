"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { setInventoryStock } from "@/features/dashboard/admin/inventory/api/inventory";
import { DashboardApiError } from "@/lib/api/dashboard";
import { revalidateStorefrontTags } from "@/lib/api/revalidate";
import {
  createProduct,
  updateProduct,
} from "@/features/dashboard/admin/products/api/products";
import type {
  CreateProductBody,
  CreateVariantBody,
  DetailsValues,
  ProductVariant,
  SaveKind,
  VariantRow,
  WizardMode,
} from "@/features/dashboard/admin/products/types";
import {
  comboKey,
  normalizeVariantAttributes,
  toErrorMessage,
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
  variants: VariantRow[],
  mode: WizardMode,
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
  const hasVariants = variants.length > 0;
  const status =
    kind === "draft"
      ? "DRAFT"
      : details.status === "ACTIVE" && !hasVariants
        ? "DRAFT"
        : details.status;
  // The whole variant set travels with the product so the server upserts
  // existing rows, creates new ones, and soft-deletes removed ones in a single
  // request instead of one round-trip per variant.
  const payloadVariants = variants.map((row) => ({
    ...(row.id ? { id: row.id } : {}),
    ...variantBody(row),
  }));
  const defaultPrice = Number(variants[0]?.price ?? 0);
  return {
    name: details.name,
    slug: details.slug,
    description: details.description || undefined,
    categoryId: details.categoryId,
    brandId: details.brandId ? details.brandId : null,
    status,
    isFeatured: details.isFeatured,
    images,
    variants: payloadVariants,
    ...(mode === "create" && payloadVariants.length
      ? {
          variantDefaults:
            Number.isFinite(defaultPrice) && defaultPrice > 0
              ? { price: defaultPrice }
              : undefined,
        }
      : {}),
  };
}

function variantComboKey(attributeValueIds: string[] | undefined): string {
  return comboKey(attributeValueIds ?? []);
}

function createdVariantComboKey(variant: ProductVariant): string {
  return comboKey(normalizeVariantAttributes(variant).map((attr) => attr.id));
}

/**
 * Pairs each request row with its created variant by stable domain identity
 * (the sorted attribute-value combination) instead of array position. The server
 * re-reads variants ordered by `isDefault desc`, so positions are not reliable.
 * Unmatched rows fall back to the remaining variants in order.
 */
function matchCreatedVariants(
  rows: VariantRow[],
  created: ProductVariant[],
): Array<ProductVariant | undefined> {
  const remaining = created.map((variant, index) => ({
    index,
    key: createdVariantComboKey(variant),
  }));
  const used = new Set<number>();
  const matched: Array<ProductVariant | undefined> = new Array(rows.length);

  rows.forEach((row, rowIndex) => {
    const key = variantComboKey(row.attributeValueIds);
    const hit = remaining.find((item) => !used.has(item.index) && item.key === key);
    if (hit) {
      used.add(hit.index);
      matched[rowIndex] = created[hit.index];
    }
  });

  for (let i = 0; i < rows.length; i += 1) {
    if (matched[i]) continue;
    const next = remaining.find((item) => !used.has(item.index));
    if (!next) break;
    used.add(next.index);
    matched[i] = created[next.index];
  }

  return matched;
}

function variantBody(row: VariantRow): CreateVariantBody {
  const sku = row.sku.trim();
  const cost = row.costPrice.trim();
  return {
    ...(sku ? { sku } : {}),
    price: Number(row.price),
    // Blank means unknown. For an existing variant null explicitly clears a
    // previously known buying cost; for a new variant the field is omitted.
    ...(cost
      ? { costPrice: Number(cost) }
      : row.id
        ? { costPrice: null }
        : {}),
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
  const [pendingKind, setPendingKind] = useState<SaveKind | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  // Kept stable across a timed-out attempt so the retry carries the same
  // Idempotency-Key and the server replays instead of double-writing. Cleared
  // on success and on any HTTP-status error (the server already stored it).
  const idempotencyKeyRef = useRef<string | null>(null);

  const invalidate = (slug?: string) => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-product"] });
    queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    void revalidateStorefrontTags([
      "home",
      "products",
      "product",
      ...(slug ? [`product:${slug}`] : []),
    ]);
  };

  const run = async (input: SaveInput): Promise<SaveResult | null> => {
    setPending(true);
    setPendingKind(input.kind);
    setProgress(null);
    let currentProductId = input.productId ?? productId ?? undefined;
    const rows: VariantRow[] = input.variants.map((row) => ({
      ...row,
      skuError: undefined,
      priceError: undefined,
      costError: undefined,
    }));

    const idempotencyKey =
      idempotencyKeyRef.current ?? globalThis.crypto.randomUUID();
    idempotencyKeyRef.current = idempotencyKey;

    try {
      const isCreate = !currentProductId;
      const body = productBody(input.details, input.kind, rows, input.mode);

      if (isCreate) {
        setProgress("Saving product");
        const created = await createProduct(body, idempotencyKey);
        currentProductId = created.id;
        setProductId(created.id);
        const createdVariants = created.variants ?? [];
        const matched = matchCreatedVariants(rows, createdVariants);
        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          const createdVariant = matched[i];
          if (!row || !createdVariant) continue;
          rows[i] = { ...row, id: createdVariant.id, sku: createdVariant.sku };
        }
      } else if (currentProductId) {
        setProgress("Saving product");
        // The update payload carries every variant, so existing rows are
        // updated, new rows created, and removed rows soft-deleted server-side
        // within the same transaction (no per-variant fan-out).
        const updated = await updateProduct(currentProductId, body, idempotencyKey);
        const savedVariants = updated.variants ?? [];
        const matched = matchCreatedVariants(rows, savedVariants);
        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          const savedVariant = matched[i];
          if (!row || !savedVariant) continue;
          rows[i] = { ...row, id: savedVariant.id, sku: savedVariant.sku };
        }
      }

      // `initialQty` is the stock level the admin wants, not a delta. Compare it
      // against the stock already on the variant so saving an unchanged value is
      // a no-op and editing it sets the level instead of piling more on top.
      // A blank field means "leave this variant's stock alone".
      const stockDelta = (row: VariantRow): number | null => {
        if (row.initialQty.trim() === "") return null;
        const target = Math.max(0, Math.trunc(Number(row.initialQty)) || 0);
        return target - (row.existingQty ?? 0);
      };
      const pendingQty = rows.some((row) => {
        const delta = stockDelta(row);
        return delta !== null && delta !== 0;
      });
      if (pendingQty && !input.warehouseId) {
        toast.error("Create a warehouse before applying stock.", {
          action: {
            label: "Create warehouse",
            onClick: () => router.push("/admin/warehouses?create=1"),
          },
        });
      }

      if (input.warehouseId) {
        const items: Array<{ variantId: string; targetQty: number }> = [];
        const targetById = new Map<string, number>();
        for (const row of rows) {
          const difference = stockDelta(row);
          if (!row.id || difference === null || difference === 0) continue;
          const targetQty = Math.max(0, Math.trunc(Number(row.initialQty)) || 0);
          items.push({ variantId: row.id, targetQty });
          targetById.set(row.id, targetQty);
        }
        if (items.length) {
          try {
            await setInventoryStock({ warehouseId: input.warehouseId, items });
            for (const row of rows) {
              const targetQty = row.id ? targetById.get(row.id) : undefined;
              if (targetQty !== undefined) row.existingQty = targetQty;
            }
          } catch (err) {
            toast.error(
              `Variants saved. Stock update failed: ${toErrorMessage(err)}`,
            );
          }
        }
      }

      if (!currentProductId) return null;
      idempotencyKeyRef.current = null;
      invalidate(input.details.slug);
      return {
        productId: currentProductId,
        variants: rows,
        failed: false,
        slugConflict: false,
      };
    } catch (err) {
      // A timeout/network failure (status 0) may mean the server never ran, so
      // keep the key to let a retry replay. Every other failure carries an HTTP
      // status: either the server stored this key (5xx records are dropped) or
      // the request was rejected outright, so a fresh key is correct next time.
      if (err instanceof DashboardApiError && err.status !== 0) {
        idempotencyKeyRef.current = null;
      }
      const slugConflict =
        err instanceof DashboardApiError &&
        err.status === 409 &&
        /slug/i.test(err.message);
      const missingWarehouse =
        err instanceof DashboardApiError &&
        /no active warehouse/i.test(err.message);
      if (missingWarehouse) {
        toast.error("Create a warehouse before publishing a product.", {
          action: {
            label: "Create warehouse",
            onClick: () => router.push("/admin/warehouses?create=1"),
          },
        });
        router.push("/admin/warehouses?create=1");
      } else if (!slugConflict) {
        toast.error(toErrorMessage(err));
      }
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
      setPendingKind(null);
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
      const hasStock = variants.some((row) => {
        const qty = Number(row.initialQty);
        return Number.isFinite(qty) && qty > 0;
      });
      toast.success(
        hasStock ? "Product published. Stock applied." : "Product published.",
        hasStock
          ? undefined
          : { action: { label: "Set stock", onClick: goStock } },
      );
    }
    router.push("/admin/products");
  };

  return { pending, pendingKind, progress, productId, setProductId, run, finish };
}

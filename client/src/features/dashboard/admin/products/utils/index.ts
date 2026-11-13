import { DashboardApiError } from "@/lib/api/dashboard";
import type {
  DetailsValues,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductListItem,
  ProductVariant,
  VariantRow,
} from "@/features/dashboard/admin/products/types";

export function normalizeVariantAttributes(
  variant: Pick<ProductVariant, "attributes">,
): NormalizedVariantAttribute[] {
  return (variant.attributes ?? []).flatMap((attr) => {
    const nested = attr?.attributeValue;
    if (nested?.id) {
      const attributeId = nested.attributeId || nested.attribute?.id || "";
      if (!attributeId) return [];
      return [
        {
          id: nested.id,
          value: nested.value,
          attributeId,
          attributeName: nested.attribute?.name,
        },
      ];
    }
    const flat = attr as unknown as {
      attributeId?: string;
      valueId?: string;
      value?: string;
      attributeName?: string;
    };
    if (!flat.valueId || !flat.attributeId) return [];
    return [
      {
        id: flat.valueId,
        value: flat.value ?? "",
        attributeId: flat.attributeId,
        attributeName: flat.attributeName,
      },
    ];
  });
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, "")}`;
}

export function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "");
}

export function blockInvalidNumberKey(
  event: { key: string; preventDefault: () => void },
  integer = false,
) {
  const blocked = integer
    ? ["e", "E", "+", "-", "."]
    : ["e", "E", "+", "-"];
  if (blocked.includes(event.key)) event.preventDefault();
}

export function productPriceRange(item: ProductListItem): {
  min: number;
  max: number;
} | null {
  const prices = item.variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function productStockSum(item: ProductListItem): number {
  return item.variants.reduce(
    (sum, variant) => sum + (variant.availableStock ?? 0),
    0,
  );
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function comboKey(attributeValueIds: string[]): string {
  return [...attributeValueIds].sort().join("|");
}

export function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])),
    [[]],
  );
}

export function focusFirstInvalid(): void {
  const el = document.querySelector<HTMLElement>(
    "[aria-invalid='true'], [data-invalid='true']",
  );
  el?.focus();
}

export function detailsFromProduct(product?: ProductDetail): DetailsValues {
  const images = product?.images ?? [];
  const imageUrls = images.map((img) => img.imageUrl).filter(Boolean);
  const primary =
    images.find((img) => img.isPrimary)?.imageUrl ?? imageUrls[0] ?? "";
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    categoryId: product?.category?.id ?? "",
    brandId: product?.brand?.id ?? "",
    description: product?.description ?? "",
    imageUrls,
    primaryImageUrl: primary,
    isFeatured: product?.isFeatured ?? false,
    status: product?.status ?? "DRAFT",
  };
}

export function variantsFromProduct(product?: ProductDetail): VariantRow[] {
  if (!product?.variants.length) {
    return [
      {
        key: "default",
        sku: "",
        skuEdited: false,
        lastSuggested: "",
        price: "",
        costPrice: "",
        isDefault: true,
        attributeValueIds: [],
        label: "Default",
        initialQty: "",
        existingQty: 0,
      },
    ];
  }
  return product.variants.map((variant) => {
    const attrs = normalizeVariantAttributes(variant);
    const ids = attrs.map((a) => a.id);
    const label =
      attrs
        .map((a) => a.value)
        .filter(Boolean)
        .join(" / ") || (variant.isDefault ? "Default" : variant.sku);
    const currentQty =
      typeof variant.availableStock === "number" && variant.availableStock > 0
        ? variant.availableStock
        : 0;
    return {
      key: ids.length ? comboKey(ids) : variant.id,
      id: variant.id,
      sku: variant.sku,
      skuEdited: true,
      lastSuggested: variant.sku,
      price: String(variant.price ?? ""),
      costPrice:
        variant.costPrice === null || variant.costPrice === undefined
          ? ""
          : String(variant.costPrice),
      isDefault: Boolean(variant.isDefault),
      attributeValueIds: ids,
      label,
      // Show the stock that is already on hand so the wizard reflects reality
      // and an unchanged value becomes a no-op instead of a re-entry.
      initialQty: currentQty > 0 ? String(currentQty) : "",
      existingQty: currentQty,
    };
  });
}

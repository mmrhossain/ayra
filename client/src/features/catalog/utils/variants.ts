import { normalizeVariantAttributes } from "@/features/catalog/api";
import type {
  AttributeGroup,
  ProductVariant,
} from "@/features/catalog/types";

export function attributeGroupsFrom(
  variants: ProductVariant[],
): AttributeGroup[] {
  const groups = new Map<string, AttributeGroup>();
  for (const variant of variants) {
    for (const attr of normalizeVariantAttributes(variant)) {
      const group = groups.get(attr.attributeId) ?? {
        attributeId: attr.attributeId,
        name: attr.attributeName ?? "Option",
        values: [],
      };
      if (!group.values.some((item) => item.id === attr.id)) {
        group.values.push({ id: attr.id, value: attr.value });
      }
      groups.set(attr.attributeId, group);
    }
  }
  return [...groups.values()];
}

export function variantValueIds(variant: ProductVariant): string[] {
  return normalizeVariantAttributes(variant).map((attr) => attr.id);
}

export function num(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

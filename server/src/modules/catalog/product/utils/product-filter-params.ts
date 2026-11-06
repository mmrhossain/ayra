import type { Prisma } from "../../../../generated/prisma/client.ts";

export type AttributeFilterGroup = {
  attributeId: string;
  valueIds: string[];
};

const normalizeAttrs = (raw?: string | string[]): string | undefined =>
  Array.isArray(raw) ? raw.join("~") : raw;

const normalizeCategories = (raw?: string | string[]): string | undefined =>
  Array.isArray(raw) ? raw.join(",") : raw;

export const parseAttributesParam = (
  raw?: string | string[],
): AttributeFilterGroup[] => {
  const normalized = normalizeAttrs(raw);
  if (!normalized) return [];

  const groups: AttributeFilterGroup[] = [];
  for (const chunk of normalized.split("~")) {
    const separatorIndex = chunk.indexOf(":");
    if (separatorIndex <= 0) continue;
    const attributeId = chunk.slice(0, separatorIndex).trim();
    const valueIds = chunk
      .slice(separatorIndex + 1)
      .split(",")
      .map((valueId) => valueId.trim())
      .filter(Boolean);
    if (attributeId && valueIds.length > 0) {
      groups.push({ attributeId, valueIds });
    }
  }
  return groups;
};

export const parseCategoriesParam = (raw?: string | string[]): string[] => {
  const normalized = normalizeCategories(raw);
  if (!normalized) return [];
  return normalized
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
};

export const buildAttributeFilterConditions = (
  groups: AttributeFilterGroup[],
): Prisma.ProductWhereInput[] =>
  groups.map((group) => ({
    variants: {
      some: {
        deletedAt: null,
        attributes: {
          some: {
            attributeValue: {
              attributeId: group.attributeId,
              id: { in: group.valueIds },
            },
          },
        },
      },
    },
  }));

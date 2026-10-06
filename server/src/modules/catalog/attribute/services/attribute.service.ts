import { prisma } from "../../../../lib/prisma.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import type {
  CreateAttributeInput,
  CreateAttributeValueInput,
  CreateAttributeValuesInput,
  UpdateAttributeInput,
  UpdateAttributeValueInput,
} from "../types.ts";

const attributeInclude = {
  values: {
    orderBy: { value: "asc" as const },
    select: {
      id: true,
      value: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

export const listAttributes = async () => {
  return prisma.attribute.findMany({
    include: attributeInclude,
    orderBy: { name: "asc" },
  });
};

export const getAttribute = async (id: string) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id },
    include: attributeInclude,
  });

  if (!attribute) throw new AppError("Attribute not found", 404);

  return attribute;
};

export const createAttribute = async (input: CreateAttributeInput) => {
  const existing = await prisma.attribute.findUnique({
    where: { name: input.name },
  });

  if (existing) throw new AppError("Attribute name already exists", 409);

  return prisma.attribute.create({
    data: { name: input.name },
    include: attributeInclude,
  });
};

export const updateAttribute = async (id: string, input: UpdateAttributeInput) => {
  const existing = await prisma.attribute.findUnique({ where: { id } });
  if (!existing) throw new AppError("Attribute not found", 404);

  if (input.name && input.name !== existing.name) {
    const nameTaken = await prisma.attribute.findUnique({
      where: { name: input.name },
    });
    if (nameTaken) throw new AppError("Attribute name already exists", 409);
  }

  return prisma.attribute.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
    },
    include: attributeInclude,
  });
};

export const deleteAttribute = async (id: string) => {
  const existing = await prisma.attribute.findUnique({
    where: { id },
    include: {
      values: {
        include: { variants: { select: { variantId: true }, take: 1 } },
      },
    },
  });

  if (!existing) throw new AppError("Attribute not found", 404);

  const inUse = existing.values.some((value) => value.variants.length > 0);
  if (inUse) {
    throw new AppError("Attribute is in use by product variants", 409);
  }

  await prisma.attributeValue.deleteMany({ where: { attributeId: id } });
  await prisma.attribute.delete({ where: { id } });

  return { deleted: true };
};

export const createAttributeValue = async (
  attributeId: string,
  input: CreateAttributeValueInput
) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id: attributeId },
    select: { id: true },
  });

  if (!attribute) throw new AppError("Attribute not found", 404);

  const existing = await prisma.attributeValue.findUnique({
    where: {
      attributeId_value: { attributeId, value: input.value },
    },
  });

  if (existing) throw new AppError("Attribute value already exists", 409);

  return prisma.attributeValue.create({
    data: {
      attributeId,
      value: input.value,
      ...(input.color !== undefined && { color: input.color }),
    },
  });
};

export const createAttributeValues = async (
  attributeId: string,
  input: CreateAttributeValuesInput
) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id: attributeId },
    select: { id: true },
  });

  if (!attribute) throw new AppError("Attribute not found", 404);

  const seen = new Set<string>();
  const candidates: Array<{ value: string; color?: string }> = [];
  for (const item of input.values) {
    const value = item.value.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    candidates.push(
      item.color !== undefined ? { value, color: item.color } : { value }
    );
  }
  if (!candidates.length) return [];

  const existing = await prisma.attributeValue.findMany({
    where: { attributeId, value: { in: candidates.map((row) => row.value) } },
    select: { value: true },
  });
  const taken = new Set(existing.map((row) => row.value));
  const rows = candidates.filter((row) => !taken.has(row.value));
  if (!rows.length) return [];

  return prisma.attributeValue.createManyAndReturn({
    data: rows.map((row) => ({
      attributeId,
      value: row.value,
      ...(row.color !== undefined && { color: row.color }),
    })),
  });
};

export const updateAttributeValue = async (
  id: string,
  input: UpdateAttributeValueInput
) => {
  const existing = await prisma.attributeValue.findUnique({ where: { id } });
  if (!existing) throw new AppError("Attribute value not found", 404);

  if (input.value && input.value !== existing.value) {
    const valueTaken = await prisma.attributeValue.findUnique({
      where: {
        attributeId_value: {
          attributeId: existing.attributeId,
          value: input.value,
        },
      },
    });
    if (valueTaken) throw new AppError("Attribute value already exists", 409);
  }

  return prisma.attributeValue.update({
    where: { id },
    data: {
      ...(input.value !== undefined && { value: input.value }),
      ...(input.color !== undefined && { color: input.color }),
    },
  });
};

export const deleteAttributeValue = async (id: string) => {
  const existing = await prisma.attributeValue.findUnique({
    where: { id },
    include: { variants: { select: { variantId: true }, take: 1 } },
  });

  if (!existing) throw new AppError("Attribute value not found", 404);

  if (existing.variants.length > 0) {
    throw new AppError("Attribute value is in use by product variants", 409);
  }

  await prisma.attributeValue.delete({ where: { id } });

  return { deleted: true };
};

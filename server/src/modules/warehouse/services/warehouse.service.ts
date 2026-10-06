import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";
import type {
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
} from "../types.ts";

const warehouseSelect = {
  id: true,
  name: true,
  code: true,
  phone: true,
  email: true,
  country: true,
  state: true,
  city: true,
  addressLine1: true,
  addressLine2: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const listWarehouses = async (query: ListWarehousesQuery) => {
  const search = query.search?.trim();
  const where: Prisma.WarehouseWhereInput = {
    deletedAt: null,
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const items = await prisma.warehouse.findMany({
    where,
    orderBy: { createdAt: "asc" },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    select: warehouseSelect,
  });
  const total = await prisma.warehouse.count({ where });

  return {
    items,
    pagination: paginate(query.page, query.limit, total),
  };
};

export const getWarehouseById = async (id: string) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id, deletedAt: null },
    select: warehouseSelect,
  });

  if (!warehouse) throw new AppError("Warehouse not found", 404);

  return warehouse;
};

export const createWarehouse = async (input: CreateWarehouseInput) => {
  const existing = await prisma.warehouse.findUnique({
    where: { code: input.code },
  });
  if (existing) throw new AppError("Warehouse code already exists", 409);

  return prisma.warehouse.create({
    data: {
      name: input.name,
      code: input.code,
      country: input.country,
      city: input.city,
      addressLine1: input.addressLine1,
      isActive: input.isActive,
      phone: input.phone ?? null,
      email: input.email ?? null,
      state: input.state ?? null,
      addressLine2: input.addressLine2 ?? null,
    },
    select: warehouseSelect,
  });
};

export const updateWarehouse = async (id: string, input: UpdateWarehouseInput) => {
  const existing = await prisma.warehouse.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new AppError("Warehouse not found", 404);

  if (input.code && input.code !== existing.code) {
    const codeTaken = await prisma.warehouse.findUnique({
      where: { code: input.code },
    });
    if (codeTaken) throw new AppError("Warehouse code already exists", 409);
  }

  return prisma.warehouse.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.addressLine1 !== undefined && { addressLine1: input.addressLine1 }),
      ...(input.addressLine2 !== undefined && { addressLine2: input.addressLine2 }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    select: warehouseSelect,
  });
};

export const deleteWarehouse = async (id: string) => {
  const existing = await prisma.warehouse.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new AppError("Warehouse not found", 404);

  return prisma.warehouse.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
    select: warehouseSelect,
  });
};

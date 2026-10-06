import { prisma } from "../../../lib/prisma.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { paginate } from "../../../common/utils/paginate.ts";
import type { ListOrdersQuery } from "../types.ts";
import {
  customerOrderDetailInclude,
  omitOrderCostPrice,
  orderDetailInclude,
  toCustomerStatusHistory,
} from "../utils/order-helpers.ts";

export const listMyOrders = async (
    customerProfileId: string,
    query: ListOrdersQuery
) => {
  const where: Prisma.OrderWhereInput = { customerProfileId, deletedAt: null };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map(omitOrderCostPrice),
    pagination: paginate(query.page, query.limit, total),
  };
};

export const getMyOrder = async (
    customerProfileId: string,
    orderId: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerProfileId, deletedAt: null },
    include: customerOrderDetailInclude,
  });

  if (!order) throw new AppError("Order not found", 404);

  const statusHistory = toCustomerStatusHistory(
    order.statusHistory.length > 0
      ? order.statusHistory
      : [
          {
            id: `legacy-${order.id}`,
            status: order.status,
            remarks: null,
            createdAt: order.createdAt,
          },
        ]
  );

  return omitOrderCostPrice({ ...order, statusHistory });
};

export const listOrders = async (query: ListOrdersQuery) => {
  const where: Prisma.OrderWhereInput = { deletedAt: null };
  const search = query.search?.trim();

  if (query.status) {
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lte: new Date(query.to) }),
    };
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { orderNumber: { contains: search, mode: "insensitive" } },
      {
        customerProfile: {
          user: { name: { contains: search, mode: "insensitive" } },
        },
      },
      {
        addresses: {
          some: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        customerProfile: {
          select: {
            id: true,
            customerCode: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    pagination: paginate(query.page, query.limit, total),
  };
};

export const getOrder = async (orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      ...orderDetailInclude,
      customerProfile: {
        select: {
          id: true,
          customerCode: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!order) throw new AppError("Order not found", 404);

  return order;
};

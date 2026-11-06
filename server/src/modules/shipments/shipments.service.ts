import { AppError } from "../../common/errors/AppError.ts";
import { env } from "../../config/env.ts";
import { paginated } from "../../common/utils/paginate.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  OrderStatus,
  ShipmentStatus,
} from "../../generated/prisma/enums.ts";
import { prisma, transaction, type TransactionClient } from "../../lib/prisma.ts";
import { enqueueShipmentUpdate } from "../notification/services/notification.service.ts";
import { buildOrderSummaryTable, escapeHtml } from "../../template/email.ts";
import type {
  CreateShipmentInput,
  ListShipmentsQuery,
  UpdateShipmentStatusInput,
} from "./types.ts";
import {
  assertShipmentTransition,
  generateShipmentNumber,
  NOTIFIABLE_SHIPMENT_STATUSES,
  SHIPMENT_EVENT_BY_STATUS,
  SHIPMENT_TIMESTAMP_FIELD,
  isCourierStatusUpdateAllowed,
  shipmentStatusLabel,
  toNumber,
} from "./shipments.utils.ts";

const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const SHIPPABLE_ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
];

const shipmentListSelect = {
  id: true,
  shipmentNumber: true,
  courierProvider: true,
  status: true,
  trackingNumber: true,
  courierReference: true,
  labelUrl: true,
  shippingCost: true,
  notes: true,
  pickupRequestedAt: true,
  pickedUpAt: true,
  shippedAt: true,
  deliveredAt: true,
  returnedAt: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
    },
  },
  warehouse: { select: { id: true, name: true, code: true } },
  _count: { select: { items: true } },
} as const;

const shipmentDetailInclude = {
  items: {
    include: {
      orderItem: {
        select: {
          id: true,
          productName: true,
          sku: true,
          variantName: true,
          quantity: true,
        },
      },
    },
  },
  trackingEvents: { orderBy: { eventTime: "desc" as const } },
  events: { orderBy: { createdAt: "desc" as const } },
  shipmentAddress: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
    },
  },
  warehouse: { select: { id: true, name: true, code: true } },
} as const;

const serializeShipment = <
  T extends { shippingCost: { toNumber: () => number } | number | string },
>(
  shipment: T,
) => ({
  ...shipment,
  shippingCost: toNumber(shipment.shippingCost) ?? 0,
});

export const listShipments = async (query: ListShipmentsQuery) => {
  const search = query.search?.trim();

  const where: Prisma.ShipmentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.courierProvider
      ? { courierProvider: query.courierProvider }
      : {}),
    ...(query.orderId ? { orderId: query.orderId } : {}),
    ...(search
      ? {
          OR: [
            { shipmentNumber: { contains: search, mode: "insensitive" } },
            { trackingNumber: { contains: search, mode: "insensitive" } },
            { courierReference: { contains: search, mode: "insensitive" } },
            {
              order: {
                orderNumber: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: shipmentListSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return paginated(items.map(serializeShipment), query.page, query.limit, total);
};

export const getShipmentById = async (id: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: shipmentDetailInclude,
  });
  if (!shipment) throw new AppError("Shipment not found", 404);
  return serializeShipment(shipment);
};

const findOrderForShipment = (client: TransactionClient, reference: string) =>
  client.order.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: reference }, { orderNumber: reference }],
    },
    include: {
      items: true,
      addresses: { where: { type: "SHIPPING" } },
    },
  });

const shippedQuantities = async (
  client: TransactionClient,
  orderId: string,
): Promise<Map<string, number>> => {
  const rows = await client.shipmentItem.findMany({
    where: {
      shipment: { orderId, status: { not: "CANCELLED" } },
    },
    select: { orderItemId: true, quantity: true },
  });

  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.orderItemId, (totals.get(row.orderItemId) ?? 0) + row.quantity);
  }
  return totals;
};

export const createShipment = async (
  input: CreateShipmentInput,
  actorId: string,
) => {
  return transaction(async (tx) => {
    const order = await findOrderForShipment(tx, input.orderId);
    if (!order) throw new AppError("Order not found", 404);

    if (!SHIPPABLE_ORDER_STATUSES.includes(order.status)) {
      throw new AppError(
        `Order ${order.orderNumber} is not ready for shipment (status ${order.status})`,
        409,
      );
    }

    if (order.paymentStatus !== "PAID") {
      const cod = await tx.payment.count({
        where: {
          orderId: order.id,
          method: "COD",
          deletedAt: null,
          status: { not: "CANCELLED" },
        },
      });

      if (cod === 0) {
        throw new AppError("Order must be paid before shipping", 409);
      }
    }

    const warehouse = await tx.warehouse.findFirst({
      where: { id: input.warehouseId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!warehouse) throw new AppError("Warehouse not found or inactive", 404);

    const orderItems = new Map(order.items.map((item) => [item.id, item]));
    const requested = new Map<string, number>();
    for (const item of input.items) {
      requested.set(
        item.orderItemId,
        (requested.get(item.orderItemId) ?? 0) + item.quantity,
      );
    }

    const alreadyShipped = await shippedQuantities(tx, order.id);
    for (const [orderItemId, quantity] of requested) {
      const orderItem = orderItems.get(orderItemId);
      if (!orderItem) {
        throw new AppError("Shipment item does not belong to this order", 400);
      }

      const remaining =
        orderItem.quantity - (alreadyShipped.get(orderItemId) ?? 0);

      if (quantity > remaining) {
        throw new AppError(
          `Cannot ship ${quantity} of ${orderItem.sku}; only ${remaining} remaining`,
          409,
        );
      }
    }

    const shippingAddress = order.addresses[0];
    const shipmentNumber = generateShipmentNumber();

    const shipment = await tx.shipment.create({
      data: {
        shipmentNumber,
        courierProvider: input.courierProvider,
        status: "PENDING",
        trackingNumber: input.trackingNumber ?? null,
        courierReference: input.courierReference ?? null,
        shippingCost: input.shippingCost ?? 0,
        notes: input.notes ?? null,
        orderId: order.id,
        warehouseId: input.warehouseId,
        items: {
          create: [...requested].map(([orderItemId, quantity]) => ({
            orderItemId,
            quantity,
          })),
        },
        trackingEvents: {
          create: {
            status: "PENDING",
            description: "Shipment created",
            eventTime: new Date(),
          },
        },
        events: {
          create: {
            eventType: "SHIPMENT_CREATED",
            metadata: {
              actorId,
              warehouseId: input.warehouseId,
              orderNumber: order.orderNumber,
            },
          },
        },
        ...(shippingAddress
          ? {
              shipmentAddress: {
                create: {
                  fullName: shippingAddress.fullName,
                  phone: shippingAddress.phone,
                  email: shippingAddress.email,
                  country: shippingAddress.country,
                  state: shippingAddress.division,
                  city: shippingAddress.district,
                  area: shippingAddress.thana,
                  postalCode: shippingAddress.postalCode,
                  divisionCode: shippingAddress.divisionCode,
                  districtCode: shippingAddress.districtCode,
                  upazilaCode: shippingAddress.upazilaCode,
                  addressLine1: shippingAddress.addressLine1,
                  addressLine2: shippingAddress.addressLine2,
                },
              },
            }
          : {}),
      },
      include: shipmentDetailInclude,
    });

    return serializeShipment(shipment);
  });
};

const recomputeOrderFulfillment = async (
  tx: TransactionClient,
  orderId: string,
) => {
  const [order, shipments] = await Promise.all([
    tx.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        items: { select: { quantity: true } },
      },
    }),
    tx.shipment.findMany({
      where: { orderId, status: { not: "CANCELLED" } },
      select: {
        status: true,
        items: { select: { quantity: true } },
      },
    }),
  ]);

  if (!order) return null;

  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const fulfilledQuantity = shipments
    .filter((shipment) => ACTIVE_SHIPMENT_STATUSES.includes(shipment.status))
    .flatMap((shipment) => shipment.items)
    .reduce((total, item) => total + item.quantity, 0);

  const fulfillmentStatus =
    fulfilledQuantity <= 0
      ? "UNFULFILLED"
      : fulfilledQuantity >= totalQuantity
        ? "FULFILLED"
        : "PARTIALLY_FULFILLED";

  const allDelivered =
    shipments.length > 0 &&
    shipments.every((shipment) => shipment.status === "DELIVERED");

  let nextStatus = order.status;
  if (
    fulfillmentStatus === "FULFILLED" &&
    allDelivered &&
    (order.status === "PROCESSING" ||
      order.status === "PACKED" ||
      order.status === "SHIPPED")
  ) {
    nextStatus = "DELIVERED";
  } else if (
    fulfillmentStatus === "FULFILLED" &&
    (order.status === "PROCESSING" || order.status === "PACKED")
  ) {
    nextStatus = "SHIPPED";
  }

  const now = new Date();
  await tx.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus,
      ...(nextStatus !== order.status ? { status: nextStatus } : {}),
      ...(nextStatus === "DELIVERED" ? { deliveredAt: now } : {}),
    },
  });

  return { nextStatus, previousStatus: order.status };
};

const syncOrderAfterShipment = async (
  tx: TransactionClient,
  orderId: string,
  actorId: string,
  shipmentNumber: string,
) => {
  const result = await recomputeOrderFulfillment(tx, orderId);
  if (!result || result.nextStatus === result.previousStatus) return;

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status: result.nextStatus,
      remarks: `Shipment ${shipmentNumber} updated`,
      changedBy: actorId,
    },
  });

  if (result.nextStatus === "SHIPPED" || result.nextStatus === "DELIVERED") {
    await tx.orderEvent.create({
      data: {
        orderId,
        eventType:
          result.nextStatus === "SHIPPED" ? "ORDER_SHIPPED" : "ORDER_DELIVERED",
        metadata: { shipmentNumber, actorId },
      },
    });
  }
};

export const updateShipmentStatus = async (
  id: string,
  input: UpdateShipmentStatusInput,
  actorId: string,
  options?: { allowCourierJump?: boolean },
) => {
  const result = await transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        shipmentNumber: true,
        orderId: true,
        courierProvider: true,
        trackingNumber: true,
        order: {
          select: {
            orderNumber: true,
            customerProfile: {
              select: {
                userId: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!shipment) throw new AppError("Shipment not found", 404);

    if (options?.allowCourierJump) {
      if (!isCourierStatusUpdateAllowed(shipment.status, input.status)) {
        throw new AppError(
          `Courier status ${input.status} cannot follow ${shipment.status}`,
          409,
        );
      }
    } else {
      assertShipmentTransition(shipment.status, input.status);
    }

    const now = new Date();
    const timestampField = SHIPMENT_TIMESTAMP_FIELD[input.status];

    await tx.shipment.update({
      where: { id },
      data: {
        status: input.status,
        ...(timestampField ? { [timestampField]: now } : {}),
        ...(input.trackingNumber
          ? { trackingNumber: input.trackingNumber }
          : {}),
        ...(input.courierReference
          ? { courierReference: input.courierReference }
          : {}),
      },
    });

    await tx.shipmentTracking.create({
      data: {
        shipmentId: id,
        status: input.status,
        location: input.location ?? null,
        description: input.description ?? null,
        eventTime: now,
      },
    });

    const eventType = SHIPMENT_EVENT_BY_STATUS[input.status];
    if (eventType) {
      await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          eventType,
          metadata: {
            actorId,
            fromStatus: shipment.status,
            toStatus: input.status,
          },
        },
      });
    }

    await syncOrderAfterShipment(
      tx,
      shipment.orderId,
      actorId,
      shipment.shipmentNumber,
    );

    const updated = await tx.shipment.findUnique({
      where: { id },
      include: shipmentDetailInclude,
    });

    return {
      shipment: serializeShipment(updated!),
      notification: NOTIFIABLE_SHIPMENT_STATUSES.includes(input.status)
        ? {
            userId: shipment.order.customerProfile.userId,
            customerName: shipment.order.customerProfile.user.name,
            shipmentNumber: shipment.shipmentNumber,
            orderNumber: shipment.order.orderNumber,
            courierProvider: shipment.courierProvider,
            trackingNumber:
              input.trackingNumber ?? shipment.trackingNumber ?? null,
            location: input.location ?? null,
            description: input.description ?? null,
          }
        : null,
    };
  });

  if (result.notification) {
    const notice = result.notification;
    const detailsTable = buildOrderSummaryTable([
      { label: "Shipment", value: notice.shipmentNumber },
      { label: "Order", value: notice.orderNumber },
      { label: "Courier", value: notice.courierProvider },
      ...(notice.trackingNumber
        ? [{ label: "Tracking number", value: notice.trackingNumber }]
        : []),
    ]);

    const description = notice.description
      ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #4b4438;">${escapeHtml(
          notice.description,
        )}${
          notice.location
            ? ` (${escapeHtml(notice.location)})`
            : ""
        }</p>`
      : notice.location
        ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #4b4438;">${escapeHtml(notice.location)}</p>`
        : "";

    await enqueueShipmentUpdate(notice.userId, {
      customerName: escapeHtml(notice.customerName),
      shipmentNumber: notice.shipmentNumber,
      orderNumber: notice.orderNumber,
      statusLabel: shipmentStatusLabel(input.status),
      detailsTable,
      description,
      trackingUrl: `${env.FRONTEND_URL.replace(/\/+$/, "")}/track?number=${encodeURIComponent(
        notice.shipmentNumber,
      )}`,
    });
  }

  return result.shipment;
};

export const getShipmentOrderContext = async (reference: string) => {
  const [order, warehouses] = await Promise.all([
    prisma.order.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: reference }, { orderNumber: reference }],
      },
      include: {
        items: true,
        shipments: {
          where: { status: { not: "CANCELLED" } },
          select: {
            id: true,
            shipmentNumber: true,
            status: true,
            createdAt: true,
            items: { select: { orderItemId: true, quantity: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) throw new AppError("Order not found", 404);

  const shipped = new Map<string, number>();
  for (const shipment of order.shipments) {
    for (const item of shipment.items) {
      shipped.set(
        item.orderItemId,
        (shipped.get(item.orderItemId) ?? 0) + item.quantity,
      );
    }
  }

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    },
    items: order.items.map((item) => {
      const shippedQuantity = shipped.get(item.id) ?? 0;
      return {
        id: item.id,
        productName: item.productName,
        sku: item.sku,
        variantName: item.variantName,
        quantity: item.quantity,
        shippedQuantity,
        remainingQuantity: Math.max(item.quantity - shippedQuantity, 0),
        unitPrice: toNumber(item.unitPrice) ?? 0,
      };
    }),
    shipments: order.shipments.map((shipment) => ({
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      createdAt: shipment.createdAt,
    })),
    warehouses,
  };
};

export const trackShipment = async (shipmentNumber: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentNumber },
    select: {
      shipmentNumber: true,
      courierProvider: true,
      status: true,
      trackingNumber: true,
      pickupRequestedAt: true,
      pickedUpAt: true,
      shippedAt: true,
      deliveredAt: true,
      returnedAt: true,
      createdAt: true,
      updatedAt: true,
      trackingEvents: {
        orderBy: { eventTime: "asc" },
        select: {
          status: true,
          location: true,
          description: true,
          eventTime: true,
        },
      },
    },
  });

  if (!shipment) throw new AppError("Shipment not found", 404);
  return shipment;
};

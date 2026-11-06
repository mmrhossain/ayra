import { AppError } from "../../../common/errors/AppError.ts";
import { logger } from "../../../common/looger/logger.ts";
import { prisma } from "../../../lib/prisma.ts";
import { ORDER_CONFIRMATION_TEMPLATE } from "../../../template/order-confirmation.ts";
import { PAYMENT_CONFIRMATION_TEMPLATE } from "../../../template/payment-confirmation.ts";
import { SHIPMENT_UPDATE_TEMPLATE } from "../../../template/shipment-update.ts";
import {
  ORDER_STATUS_MESSAGES,
  ORDER_STATUS_UPDATE_TEMPLATE,
  type NotifiableOrderStatus,
} from "../../../template/order-status-update.ts";
import {
  buildLowStockTable,
  LOW_STOCK_ALERT_TEMPLATE,
  type LowStockAlertItem,
} from "../../../template/low-stock-alert.ts";
import { NEW_ORDER_ALERT_TEMPLATE } from "../../../template/new-order-alert.ts";
import { env } from "../../../config/env.ts";
import { escapeHtml } from "../../../template/email.ts";
import { pushInAppNotification } from "../in-app.service.ts";
import type { TemplateData, TemplateSeed } from "../types.ts";

const render = (template: string, data: TemplateData): string =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = data[key];
    return value === null || value === undefined ? "" : String(value);
  });

const recipientFor = (channel: string, user: { email: string }): string => {
  if (channel === "EMAIL") return user.email;
  return user.email;
};

export const createNotification = async (
  userId: string,
  templateCode: string,
  data: TemplateData = {},
) => {
  const template = await prisma.notificationTemplate.findUnique({
    where: { code: templateCode },
  });

  if (!template) {
    throw new AppError(
      `Notification template '${templateCode}' not found`,
      404,
    );
  }

  if (!template.isActive) {
    throw new AppError(
      `Notification template '${templateCode}' is inactive`,
      400,
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  return prisma.notification.create({
    data: {
      userId,
      templateId: template.id,
      channel: template.channel,
      recipient: recipientFor(template.channel, user),
      subject: template.subject ? render(template.subject, data) : null,
      content: render(template.content, data),
      metadata: { templateCode, variables: data },
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
      channel: true,
      recipient: true,
      createdAt: true,
    },
  });
};

export const ensureNotificationTemplate = async (
  seed: TemplateSeed,
) => {
  return prisma.notificationTemplate.upsert({
    where: { code: seed.code },
    create: {
      code: seed.code,
      name: seed.name,
      channel: seed.channel,
      subject: seed.subject,
      content: seed.content,
      variables: seed.variables,
      isActive: true,
    },
    update: {
      name: seed.name,
      channel: seed.channel,
      subject: seed.subject,
      content: seed.content,
      variables: seed.variables,
      isActive: true,
    },
  });
};

export const enqueueNotification = async (
  userId: string,
  seed: TemplateSeed,
  data: TemplateData = {},
) => {
  try {
    const [user, preferences] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userNotificationPreference.findUnique({
        where: { userId },
        select: { emailEnabled: true, pushEnabled: true, smsEnabled: true },
      }),
    ]);

    if (!user) throw new AppError("User not found", 404);

    const channelEnabled =
      !preferences ||
      (seed.channel === "EMAIL"
        ? preferences.emailEnabled
        : seed.channel === "PUSH"
          ? preferences.pushEnabled
          : seed.channel === "SMS"
            ? preferences.smsEnabled
            : true);

    if (!channelEnabled) return;

    const template = await ensureNotificationTemplate(seed);
    if (!template.isActive) {
      throw new AppError(
        `Notification template '${seed.code}' is inactive`,
        400,
      );
    }

    await prisma.notification.create({
      data: {
        userId,
        templateId: template.id,
        channel: template.channel,
        recipient: recipientFor(template.channel, user),
        subject: template.subject ? render(template.subject, data) : null,
        content: render(template.content, data),
        metadata: { templateCode: seed.code, variables: data },
        status: "PENDING",
      },
    });
  } catch (err) {
    logger.error({
      msg: "Failed to enqueue notification",
      templateCode: seed.code,
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const enqueueOrderConfirmation = async (
  userId: string,
  data: TemplateData,
) => {
  await enqueueNotification(userId, ORDER_CONFIRMATION_TEMPLATE, data);
  await pushInAppNotification({
    userId,
    title: `Order ${String(data.orderNumber ?? "")} confirmed`,
    body: "We received your order and will start preparing it shortly.",
    href: typeof data.orderUrl === "string" ? data.orderUrl : "/customer/orders",
    level: "SUCCESS",
    metadata: { event: "order.confirmed" },
  });
};

export const enqueuePaymentConfirmation = async (
  userId: string,
  data: TemplateData,
) => {
  await enqueueNotification(userId, PAYMENT_CONFIRMATION_TEMPLATE, data);
  await pushInAppNotification({
    userId,
    title: `Payment received for ${String(data.orderNumber ?? "")}`,
    body: `${String(data.currency ?? "BDT")} ${String(data.amount ?? "")} was confirmed via ${String(data.method ?? "payment")}.`,
    href: "/customer/orders",
    level: "SUCCESS",
    metadata: { event: "payment.confirmed" },
  });
};

export const enqueueShipmentUpdate = async (
  userId: string,
  data: TemplateData,
) => {
  await enqueueNotification(userId, SHIPMENT_UPDATE_TEMPLATE, data);
  await pushInAppNotification({
    userId,
    title: `Shipment ${String(data.statusLabel ?? "update")}`,
    body: `Shipment ${String(data.shipmentNumber ?? "")} for order ${String(data.orderNumber ?? "")} is now ${String(data.statusLabel ?? "updated")}.`,
    href:
      typeof data.trackingUrl === "string"
        ? data.trackingUrl
        : "/customer/orders",
    level: "INFO",
    metadata: { event: "shipment.updated" },
  });
};

export const notifyNewOrder = async (data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  currency: string;
  grandTotal: string;
  itemsTable: string;
  summaryTable: string;
  orderUrl: string;
}) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", banned: false, deletedAt: null },
      select: { id: true, name: true },
    });

    if (admins.length === 0) return;

    await Promise.all(
      admins.map(async (admin) => {
        await enqueueNotification(admin.id, NEW_ORDER_ALERT_TEMPLATE, {
          adminName: escapeHtml(admin.name),
          orderNumber: data.orderNumber,
          customerName: escapeHtml(data.customerName),
          customerEmail: escapeHtml(data.customerEmail),
          currency: data.currency,
          grandTotal: data.grandTotal,
          itemsTable: data.itemsTable,
          summaryTable: data.summaryTable,
          orderUrl: data.orderUrl,
        });
        await pushInAppNotification({
          userId: admin.id,
          title: `New order ${data.orderNumber}`,
          body: `${data.customerName} placed an order for ${data.currency} ${data.grandTotal}.`,
          href: "/admin/orders",
          level: "INFO",
          metadata: { event: "order.created", orderNumber: data.orderNumber },
        });
      }),
    );
  } catch (err) {
    logger.error({
      msg: "Failed to queue new order alert",
      orderNumber: data.orderNumber,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const notifyLowStock = async (items: LowStockAlertItem[]) => {
  if (items.length === 0) return;

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", banned: false, deletedAt: null },
      select: { id: true, name: true },
    });

    if (admins.length === 0) return;

    const itemsTable = buildLowStockTable(items);
    const inventoryUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/admin/inventory`;

    await Promise.all(
      admins.map(async (admin) => {
        await enqueueNotification(admin.id, LOW_STOCK_ALERT_TEMPLATE, {
          adminName: escapeHtml(admin.name),
          itemCount: items.length,
          threshold: env.LOW_STOCK_THRESHOLD,
          itemsTable,
          inventoryUrl,
        });
        await pushInAppNotification({
          userId: admin.id,
          title: `Low stock: ${items.length} item(s)`,
          body: `${items.length} item(s) are at or below the threshold of ${env.LOW_STOCK_THRESHOLD}.`,
          href: "/admin/inventory",
          level: "WARNING",
          metadata: { event: "inventory.low_stock", itemCount: items.length },
        });
      }),
    );
  } catch (err) {
    logger.error({
      msg: "Failed to queue low stock alert",
      itemCount: items.length,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const notifyOrderStatusChange = async (
  orderId: string,
  status: string,
) => {
  const message = ORDER_STATUS_MESSAGES[status as NotifiableOrderStatus];
  if (!message) return;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        customerProfile: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
        _count: { select: { shipments: true } },
      },
    });

    if (!order?.customerProfile?.userId) return;

    // Shipment status emails already cover orders that have shipments.
    if (
      (status === "SHIPPED" || status === "DELIVERED") &&
      order._count.shipments > 0
    ) {
      return;
    }

    await enqueueNotification(order.customerProfile.userId, ORDER_STATUS_UPDATE_TEMPLATE, {
      customerName: escapeHtml(order.customerProfile.user.name),
      orderNumber: order.orderNumber,
      statusLabel: message.label,
      statusDescription: message.description,
      orderUrl: `${env.FRONTEND_URL.replace(/\/+$/, "")}/customer/orders/view-order/${encodeURIComponent(orderId)}`,
    });

    await pushInAppNotification({
      userId: order.customerProfile.userId,
      title: `Order ${order.orderNumber}: ${message.label}`,
      body: message.description,
      href: `/customer/orders/view-order/${encodeURIComponent(orderId)}`,
      level:
        status === "CANCELLED" || status === "RETURNED" ? "WARNING" : "INFO",
      metadata: { event: "order.status_changed", status },
    });
  } catch (err) {
    logger.error({
      msg: "Failed to queue order status notification",
      orderId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

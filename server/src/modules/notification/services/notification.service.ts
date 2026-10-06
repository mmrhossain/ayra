import { AppError } from "../../../common/errors/AppError.ts";
import { logger } from "../../../common/looger/logger.ts";
import { prisma } from "../../../lib/prisma.ts";
import { ORDER_CONFIRMATION_TEMPLATE } from "../../../template/order-confirmation.ts";
import { PAYMENT_CONFIRMATION_TEMPLATE } from "../../../template/payment-confirmation.ts";
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
    const [template, user] = await Promise.all([
      ensureNotificationTemplate(seed),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!user) throw new AppError("User not found", 404);
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
) => enqueueNotification(userId, ORDER_CONFIRMATION_TEMPLATE, data);

export const enqueuePaymentConfirmation = async (
  userId: string,
  data: TemplateData,
) => enqueueNotification(userId, PAYMENT_CONFIRMATION_TEMPLATE, data);

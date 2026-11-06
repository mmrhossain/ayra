import { AppError } from "../../common/errors/AppError.ts";
import { logger } from "../../common/looger/logger.ts";
import { isPrismaCode } from "../../common/utils/prisma-error.ts";
import { env } from "../../config/env.ts";
import type { CourierProvider } from "../../generated/prisma/enums.ts";
import { prisma, transaction } from "../../lib/prisma.ts";
import { getShipmentById, updateShipmentStatus } from "../shipments/shipments.service.ts";
import type {
  CourierBookingInput,
  CourierProviderAdapter,
  CourierWebhookEvent,
} from "./courier.types.ts";
import { pathaoProvider } from "./pathao.provider.ts";
import { steadfastProvider } from "./steadfast.provider.ts";
import { safeSecretEqual, verifyHmacSignature } from "./courier.utils.ts";

const ADAPTERS: Partial<Record<CourierProvider, CourierProviderAdapter>> = {
  PATHAO: pathaoProvider,
  STEADFAST: steadfastProvider,
};

const adapterFor = (provider: CourierProvider): CourierProviderAdapter => {
  const adapter = ADAPTERS[provider];
  if (!adapter) {
    throw new AppError(
      `Courier provider ${provider} does not support API booking`,
      400,
    );
  }
  return adapter;
};

const webhookSecretFor = (provider: CourierProvider): string | undefined => {
  if (provider === "PATHAO") return env.PATHAO_WEBHOOK_SECRET;
  if (provider === "STEADFAST") return env.STEADFAST_WEBHOOK_SECRET;
  return undefined;
};

const buildContactAddress = (address: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  area: string | null;
  postalCode: string | null;
}) =>
  [address.addressLine1, address.addressLine2, address.area, address.city, address.postalCode]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");

export const bookShipmentCourier = async (
  shipmentId: string,
  actorId: string,
) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      shipmentNumber: true,
      status: true,
      courierProvider: true,
      courierReference: true,
      shipmentAddress: true,
      items: {
        select: {
          quantity: true,
          orderItem: { select: { productName: true, sku: true } },
        },
      },
      order: {
        select: {
          orderNumber: true,
          paymentStatus: true,
          grandTotal: true,
        },
      },
    },
  });

  if (!shipment) throw new AppError("Shipment not found", 404);
  if (shipment.courierReference) {
    throw new AppError("This shipment is already booked with a courier", 409);
  }
  if (shipment.status !== "PENDING" && shipment.status !== "READY_TO_SHIP") {
    throw new AppError(
      `Courier booking is only available for PENDING or READY_TO_SHIP shipments (current: ${shipment.status})`,
      409,
    );
  }
  if (!shipment.shipmentAddress) {
    throw new AppError("Shipment has no delivery address", 400);
  }

  const address = shipment.shipmentAddress;
  const quantity = shipment.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const input: CourierBookingInput = {
    shipmentNumber: shipment.shipmentNumber,
    orderNumber: shipment.order.orderNumber,
    recipientName: address.fullName,
    recipientPhone: address.phone,
    recipientAddress: buildContactAddress(address),
    recipientCity: address.city,
    recipientArea: address.area ?? address.state ?? undefined,
    recipientPostalCode: address.postalCode ?? undefined,
    codAmount:
      shipment.order.paymentStatus === "PAID"
        ? 0
        : Number(shipment.order.grandTotal),
    itemQuantity: quantity,
    itemDescription: shipment.items
      .map((item) => `${item.orderItem.productName} x${item.quantity}`)
      .join(", ")
      .slice(0, 250),
  };

  const adapter = adapterFor(shipment.courierProvider);
  const booking = await adapter.book(input);

  await transaction(async (tx) => {
    const now = new Date();
    await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "PICKUP_REQUESTED",
        pickupRequestedAt: now,
        trackingNumber: booking.trackingNumber,
        courierReference: booking.courierReference,
        ...(booking.labelUrl ? { labelUrl: booking.labelUrl } : {}),
      },
    });

    await tx.shipmentTracking.create({
      data: {
        shipmentId: shipment.id,
        status: "PICKUP_REQUESTED",
        description: `Courier booked with ${shipment.courierProvider}`,
        eventTime: now,
      },
    });

    await tx.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        eventType: "PICKUP_REQUESTED",
        metadata: {
          actorId,
          provider: shipment.courierProvider,
          courierReference: booking.courierReference,
        },
      },
    });
  });

  return getShipmentById(shipment.id);
};

const resolveShipmentForEvent = (provider: CourierProvider, event: CourierWebhookEvent) => {
  const OR = [
    ...(event.reference ? [{ courierReference: event.reference }] : []),
    ...(event.trackingNumber ? [{ trackingNumber: event.trackingNumber }] : []),
    ...(event.invoice ? [{ shipmentNumber: event.invoice }] : []),
  ];

  if (OR.length === 0) return null;

  return prisma.shipment.findFirst({
    where: { courierProvider: provider, OR },
    select: { id: true, status: true, trackingNumber: true, shipmentNumber: true },
  });
};

export const handleCourierWebhook = async ({
  provider,
  payload,
  rawBody,
  signature,
  sharedSecret,
}: {
  provider: CourierProvider;
  payload: unknown;
  rawBody: Buffer | undefined;
  signature: string | undefined;
  sharedSecret: string | undefined;
}) => {
  const secret = webhookSecretFor(provider);
  if (!secret) {
    throw new AppError(
      `${provider} webhook secret is not configured`,
      503,
    );
  }

  const valid =
    verifyHmacSignature(rawBody, signature, secret) ||
    safeSecretEqual(sharedSecret, secret);

  if (!valid) throw new AppError("Invalid courier webhook signature", 401);

  const event = adapterFor(provider).parseWebhook(payload);

  let log;
  try {
    log = await prisma.courierWebhookLog.create({
      data: {
        provider,
        eventType: event.status ?? "UNMAPPED",
        externalEventId: event.eventId,
        payload: (payload ?? {}) as object,
      },
    });
  } catch (error) {
    if (isPrismaCode(error, "P2002")) {
      return { processed: false, duplicate: true };
    }
    throw error;
  }

  const finish = async (processed: boolean) => {
    await prisma.courierWebhookLog.update({
      where: { id: log.id },
      data: { processed, processedAt: new Date() },
    });
  };

  if (!event.status) {
    await finish(true);
    return { processed: false, duplicate: false, reason: "unmapped_status" };
  }

  const shipment = await resolveShipmentForEvent(provider, event);
  if (!shipment) {
    await finish(true);
    return { processed: false, duplicate: false, reason: "shipment_not_found" };
  }

  if (shipment.status === event.status) {
    await finish(true);
    return { processed: false, duplicate: false, reason: "status_unchanged" };
  }

  try {
    await updateShipmentStatus(
      shipment.id,
      {
        status: event.status,
        ...(event.description ? { description: event.description } : {}),
        ...(event.location ? { location: event.location } : {}),
        ...(event.trackingNumber && !shipment.trackingNumber
          ? { trackingNumber: event.trackingNumber }
          : {}),
      },
      `courier:${provider.toLowerCase()}`,
      { allowCourierJump: true },
    );
    await finish(true);
    return { processed: true, duplicate: false };
  } catch (error) {
    logger.warn({
      msg: "Courier webhook status update ignored",
      provider,
      shipmentId: shipment.id,
      status: event.status,
      error: error instanceof Error ? error.message : String(error),
    });
    await finish(false);
    return {
      processed: false,
      duplicate: false,
      reason: "invalid_transition",
    };
  }
};

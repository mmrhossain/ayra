import { AppError } from "../../common/errors/AppError.ts";
import { env } from "../../config/env.ts";
import type { CourierProviderAdapter } from "./courier.types.ts";
import {
  asNumber,
  asRecord,
  asString,
  courierRequest,
  trimBaseUrl,
} from "./courier.http.ts";
import { hashPayload, mapCourierStatus } from "./courier.utils.ts";

const getConfig = () => {
  const { STEADFAST_BASE_URL, STEADFAST_API_KEY, STEADFAST_SECRET_KEY } = env;

  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    throw new AppError(
      "Steadfast is not configured. Set STEADFAST_API_KEY and STEADFAST_SECRET_KEY.",
      503,
    );
  }

  return {
    baseUrl: trimBaseUrl(STEADFAST_BASE_URL),
    apiKey: STEADFAST_API_KEY,
    secretKey: STEADFAST_SECRET_KEY,
  };
};

export const steadfastProvider: CourierProviderAdapter = {
  provider: "STEADFAST",

  async book(input) {
    const config = getConfig();

    const payload = await courierRequest(
      `${config.baseUrl}/create_order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": config.apiKey,
          "Secret-Key": config.secretKey,
        },
        body: JSON.stringify({
          invoice: input.shipmentNumber,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone,
          recipient_address: input.recipientAddress,
          recipient_city: input.recipientCity,
          recipient_area: input.recipientArea ?? input.recipientCity,
          cod_amount: input.codAmount,
          note: input.note ?? input.itemDescription,
        }),
      },
      "Steadfast",
    );

    const root = asRecord(payload);
    const consignment = asRecord(root.consignment);
    const consignmentId = asString(consignment.consignment_id);
    if (!consignmentId) {
      const message = asString(root.message);
      throw new AppError(
        `Steadfast did not return a consignment id${message ? `: ${message}` : ""}`,
        502,
      );
    }

    return {
      courierReference: consignmentId,
      trackingNumber:
        asString(consignment.tracking_code) ??
        asString(consignment.consignment_id) ??
        consignmentId,
      rawStatus: asString(consignment.status),
      deliveryFee:
        asNumber(consignment.delivery_fee) ?? asNumber(consignment.delivery_charge),
    };
  },

  parseWebhook(payload) {
    const root = asRecord(payload);
    const data = asRecord(root.consignment ?? root.data ?? root);

    return {
      eventId:
        asString(root.event_id ?? root.webhook_id) ?? hashPayload(payload),
      reference: asString(data.consignment_id ?? root.consignment_id),
      trackingNumber: asString(data.tracking_code ?? root.tracking_code),
      invoice: asString(data.invoice ?? root.invoice),
      status: mapCourierStatus(data.status ?? root.status),
      description: asString(data.message ?? root.message) ?? asString(data.status ?? root.status),
      location: asString(data.location ?? root.location),
      eventTime: asString(
        data.updated_at ?? data.updatedAt ?? root.updated_at ?? root.updatedAt,
      ),
    };
  },
};

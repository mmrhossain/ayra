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

type PathaoConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  storeId: number;
  cityId: number;
  zoneId: number;
  areaId: number | undefined;
};

type TokenCache = { accessToken: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

const getConfig = (): PathaoConfig => {
  const {
    PATHAO_BASE_URL,
    PATHAO_CLIENT_ID,
    PATHAO_CLIENT_SECRET,
    PATHAO_USERNAME,
    PATHAO_PASSWORD,
    PATHAO_STORE_ID,
    PATHAO_DEFAULT_CITY_ID,
    PATHAO_DEFAULT_ZONE_ID,
    PATHAO_DEFAULT_AREA_ID,
  } = env;

  if (
    !PATHAO_BASE_URL ||
    !PATHAO_CLIENT_ID ||
    !PATHAO_CLIENT_SECRET ||
    !PATHAO_USERNAME ||
    !PATHAO_PASSWORD ||
    !PATHAO_STORE_ID ||
    !PATHAO_DEFAULT_CITY_ID ||
    !PATHAO_DEFAULT_ZONE_ID
  ) {
    throw new AppError(
      "Pathao is not configured. Set PATHAO_BASE_URL, PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_USERNAME, PATHAO_PASSWORD, PATHAO_STORE_ID, PATHAO_DEFAULT_CITY_ID, and PATHAO_DEFAULT_ZONE_ID.",
      503,
    );
  }

  return {
    baseUrl: trimBaseUrl(PATHAO_BASE_URL),
    clientId: PATHAO_CLIENT_ID,
    clientSecret: PATHAO_CLIENT_SECRET,
    username: PATHAO_USERNAME,
    password: PATHAO_PASSWORD,
    storeId: PATHAO_STORE_ID,
    cityId: PATHAO_DEFAULT_CITY_ID,
    zoneId: PATHAO_DEFAULT_ZONE_ID,
    areaId: PATHAO_DEFAULT_AREA_ID,
  };
};

const getAccessToken = async (config: PathaoConfig): Promise<string> => {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const payload = await courierRequest(
    `${config.baseUrl}/aladdin/api/v1/issue-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        username: config.username,
        password: config.password,
        grant_type: "password",
      }),
    },
    "Pathao",
  );

  const data = asRecord(payload);
  const accessToken = asString(data.access_token);
  if (!accessToken) {
    throw new AppError("Pathao did not return an access token", 502);
  }

  const expiresIn = asNumber(data.expires_in) ?? 3600;
  tokenCache = {
    accessToken,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  };

  return accessToken;
};

export const pathaoProvider: CourierProviderAdapter = {
  provider: "PATHAO",

  async book(input) {
    const config = getConfig();
    const accessToken = await getAccessToken(config);

    const payload = await courierRequest(
      `${config.baseUrl}/aladdin/api/v1/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: config.storeId,
          merchant_order_id: input.shipmentNumber,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone,
          recipient_address: input.recipientAddress,
          recipient_city: config.cityId,
          recipient_zone: config.zoneId,
          ...(config.areaId ? { recipient_area: config.areaId } : {}),
          delivery_type: 48,
          item_type: 2,
          item_quantity: input.itemQuantity,
          item_weight: 0.5,
          item_description: input.itemDescription,
          amount_to_collect: input.codAmount,
          ...(input.note ? { special_instruction: input.note } : {}),
        }),
      },
      "Pathao",
    );

    const data = asRecord(asRecord(payload).data);
    const consignmentId = asString(data.consignment_id);
    if (!consignmentId) {
      throw new AppError("Pathao did not return a consignment id", 502);
    }

    return {
      courierReference: consignmentId,
      trackingNumber:
        asString(data.tracking_code) ?? asString(data.consignment_id) ?? consignmentId,
      labelUrl: asString(data.label_url),
      rawStatus: asString(data.order_status),
      deliveryFee: asNumber(data.delivery_fee),
    };
  },

  parseWebhook(payload) {
    const root = asRecord(payload);
    const data = asRecord(root.data ?? root);
    const reference = asString(data.consignment_id ?? root.consignment_id);
    const trackingNumber = asString(data.tracking_code ?? root.tracking_code);

    return {
      eventId:
        asString(root.event_id ?? root.webhook_id) ?? hashPayload(payload),
      reference,
      trackingNumber,
      invoice: asString(data.merchant_order_id ?? root.merchant_order_id),
      status: mapCourierStatus(data.order_status ?? data.status ?? root.order_status),
      description:
        asString(data.message ?? root.message) ??
        asString(data.order_status ?? root.order_status),
      location: asString(data.location ?? root.location),
      eventTime: asString(
        data.updated_at ?? data.timestamp ?? root.updated_at ?? root.timestamp,
      ),
    };
  },
};

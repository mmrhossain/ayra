import { z } from "zod";
import { env } from "../../config/env.ts";
import type {
  SettingDefinition,
  SettingGroup,
} from "./types.ts";

const trimUrl = (value: string) => value.replace(/\/+$/, "");

const sandboxFromEnv = () => {
  const value = String(env.SSLCOMMERZ_SANDBOX ?? "").trim().toLowerCase();
  return value === "true" || value === "1" || value === "sandbox";
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    key: "store",
    label: "Store",
    description: "Storefront identity and customer-facing contact details.",
  },
  {
    key: "payment",
    label: "Payment",
    description:
      "Gateway credentials, sandbox/live mode, callback origin, and enabled methods.",
  },
  {
    key: "checkout",
    label: "Checkout",
    description: "Tax behaviour and checkout display settings.",
  },
];

const definitions: SettingDefinition[] = [
  {
    key: "store.name",
    group: "store",
    label: "Store name",
    type: "string",
    schema: z.string().trim().min(1).max(120),
    defaultValue: "Ayra",
    isPublic: true,
  },
  {
    key: "store.supportEmail",
    group: "store",
    label: "Support email",
    type: "string",
    schema: z.union([z.string().trim().email().max(200), z.literal("")]),
    defaultValue: "",
    isPublic: true,
  },
  {
    key: "store.supportPhone",
    group: "store",
    label: "Support phone",
    type: "string",
    schema: z.string().trim().max(40),
    defaultValue: "",
    isPublic: true,
  },
  {
    key: "store.address",
    group: "store",
    label: "Store address",
    type: "textarea",
    schema: z.string().trim().max(500),
    defaultValue: "Gulshan-2, Dhaka\nBangladesh",
    isPublic: true,
  },
  {
    key: "store.logoUrl",
    group: "store",
    label: "Logo URL",
    type: "url",
    schema: z.union([z.string().trim().url().max(2000), z.literal("")]),
    defaultValue: "",
    isPublic: true,
  },
  {
    key: "store.frontendUrl",
    group: "store",
    label: "Frontend base URL",
    type: "url",
    schema: z.string().trim().url().max(2000),
    defaultValue: () => env.FRONTEND_URL,
    help: "Used for redirects after payment. Must be publicly reachable.",
  },
  {
    key: "store.currency",
    group: "store",
    label: "Currency",
    type: "select",
    schema: z.literal("BDT"),
    defaultValue: "BDT",
    isPublic: true,
    readOnly: true,
    options: [{ value: "BDT", label: "BDT" }],
    help: "Multi-currency checkout is not enabled yet.",
  },
  {
    key: "payment.enabledMethods",
    group: "payment",
    label: "Enabled payment methods",
    type: "multiselect",
    schema: z.array(z.enum(["COD", "SSLCOMMERZ"])).min(1),
    defaultValue: ["COD", "SSLCOMMERZ"],
    isPublic: true,
    options: [
      { value: "COD", label: "Cash on delivery" },
      { value: "SSLCOMMERZ", label: "SSLCommerz" },
    ],
  },
  {
    key: "payment.callbackBaseUrl",
    group: "payment",
    label: "Callback base URL",
    type: "url",
    schema: z.string().trim().url().max(2000),
    defaultValue: () =>
      trimUrl(
        env.PAYMENT_CALLBACK_BASE_URL || env.BETTER_AUTH_URL,
      ),
    help: "Public origin SSLCommerz can reach. Callbacks are mounted under /api/v1/payments/sslcommerz.",
  },
  {
    key: "payment.sslcommerz.mode",
    group: "payment",
    label: "SSLCommerz mode",
    type: "select",
    schema: z.enum(["sandbox", "live"]),
    defaultValue: () => (sandboxFromEnv() ? "sandbox" : "live"),
    options: [
      { value: "sandbox", label: "Sandbox" },
      { value: "live", label: "Live" },
    ],
  },
  {
    key: "payment.sslcommerz.sandboxStoreId",
    group: "payment",
    label: "Sandbox store ID",
    type: "string",
    schema: z.string().trim().max(120),
    defaultValue: () => env.SSLCOMMERZ_STORE_ID ?? "",
  },
  {
    key: "payment.sslcommerz.sandboxStorePassword",
    group: "payment",
    label: "Sandbox store password",
    type: "secret",
    schema: z.string().max(500),
    defaultValue: () => env.SSLCOMMERZ_STORE_PASSWORD ?? "",
    isSecret: true,
  },
  {
    key: "payment.sslcommerz.liveStoreId",
    group: "payment",
    label: "Live store ID",
    type: "string",
    schema: z.string().trim().max(120),
    defaultValue: "",
  },
  {
    key: "payment.sslcommerz.liveStorePassword",
    group: "payment",
    label: "Live store password",
    type: "secret",
    schema: z.string().max(500),
    defaultValue: "",
    isSecret: true,
  },
  {
    key: "checkout.pricesIncludeTax",
    group: "checkout",
    label: "Prices include tax",
    type: "boolean",
    schema: z.boolean(),
    defaultValue: true,
    isPublic: true,
    help: "When enabled, no additional tax is added to item prices.",
  },
  {
    key: "checkout.taxRatePercent",
    group: "checkout",
    label: "Tax rate (%)",
    type: "number",
    schema: z.number().min(0).max(100),
    defaultValue: 0,
    isPublic: true,
  },
  {
    key: "checkout.freeShippingThreshold",
    group: "checkout",
    label: "Free shipping threshold",
    type: "number",
    schema: z.number().min(0).nullable(),
    defaultValue: null,
    isPublic: true,
    help: "Display-only in Phase 1; shipping rates remain in the shipping module.",
  },
];

const groupKeys = new Set(SETTING_GROUPS.map((group) => group.key));

export const SETTING_DEFINITIONS = new Map<string, SettingDefinition>();

for (const definition of definitions) {
  if (SETTING_DEFINITIONS.has(definition.key)) {
    throw new Error(`Duplicate setting key: ${definition.key}`);
  }
  if (!groupKeys.has(definition.group)) {
    throw new Error(
      `Setting ${definition.key} references unknown group ${definition.group}`,
    );
  }
  SETTING_DEFINITIONS.set(definition.key, definition);
}

export const getSettingsByGroup = (group: string) =>
  definitions.filter((definition) => definition.group === group);

export const isKnownSetting = (key: string) => SETTING_DEFINITIONS.has(key);

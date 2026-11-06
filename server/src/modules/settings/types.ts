import type { PaymentMethod } from "../../generated/prisma/enums.ts";

export type SettingFieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "url"
  | "secret"
  | "textarea";

export type SettingOption = { value: string; label: string };

export type SecretEnvelope = {
  v: 1;
  iv: string;
  tag: string;
  ct: string;
};

export type SettingDefinition = {
  key: string;
  group: string;
  label: string;
  type: SettingFieldType;
  schema: { parse: (value: unknown) => unknown };
  defaultValue: unknown | (() => unknown);
  isPublic?: boolean;
  isSecret?: boolean;
  readOnly?: boolean;
  options?: SettingOption[];
  help?: string;
};

export type SettingGroup = {
  key: string;
  label: string;
  description: string;
};

export type AdminSettingField = {
  key: string;
  label: string;
  type: SettingFieldType;
  help?: string | undefined;
  options?: SettingOption[] | undefined;
  readOnly?: boolean | undefined;
  value?: unknown;
  configured?: boolean | undefined;
  last4?: string | null | undefined;
};

export type AdminSettingGroup = {
  key: string;
  label: string;
  description: string;
  fields: AdminSettingField[];
};

export type PublicSettings = {
  store: {
    name: string;
    supportEmail: string;
    supportPhone: string;
    logoUrl: string;
    currency: string;
  };
  payment: {
    enabledMethods: PaymentMethod[];
  };
  checkout: {
    pricesIncludeTax: boolean;
    taxRatePercent: number;
    freeShippingThreshold: number | null;
  };
};

export type SettingsAuditQuery = {
  page: number;
  limit: number;
};

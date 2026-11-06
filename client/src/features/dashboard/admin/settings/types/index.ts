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

export type AdminSettingField = {
  key: string;
  label: string;
  type: SettingFieldType;
  help?: string;
  options?: SettingOption[];
  readOnly?: boolean;
  value?: unknown;
  configured?: boolean;
  last4?: string | null;
};

export type AdminSettingGroup = {
  key: string;
  label: string;
  description: string;
  fields: AdminSettingField[];
};

export type SettingsEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

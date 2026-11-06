import type { GeoEntity } from "../types.ts";

const asString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asAliases = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

export const toGeoEntity = (value: unknown): GeoEntity | null => {
  const record = asRecord(value);
  if (!record) return null;

  const code = asString(record.code);
  const name = asString(record.name);
  if (!code || !name) return null;

  if (asString(record.deprecated_at) !== null) return null;

  return {
    code,
    name,
    bnName: asString(record.bn_name),
    slug: asString(record.slug),
    aliases: asAliases(record.aliases),
    divisionCode: asString(record.divisionCode),
    districtCode: asString(record.districtCode),
    upazilaCode: asString(record.upazilaCode),
  };
};

/**
 * Reads the reference service envelope `{ status, data }` and returns the list
 * of usable records. Deprecated records are dropped here so every consumer sees
 * the same filtered view.
 */
export const readGeoList = (payload: unknown): GeoEntity[] | null => {
  const record = asRecord(payload);
  if (!record || !Array.isArray(record.data)) return null;

  return record.data
    .map(toGeoEntity)
    .filter((item): item is GeoEntity => item !== null);
};

export const buildGeoUrl = (
  baseUrl: string,
  path: string,
  params: Record<string, string | undefined> = {}
): string => {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
};

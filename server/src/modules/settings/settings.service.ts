import { prisma, transaction } from "../../lib/prisma.ts";
import { AppError } from "../../common/errors/AppError.ts";
import { paginate } from "../../common/utils/paginate.ts";
import { withDbRetry } from "../../common/utils/db-retry.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { extractCloudinaryPublicId } from "../../common/utils/cloudinary-public-id.ts";
import {
  attachMediaAssets,
  detachMediaAssets,
} from "../media/media.service.ts";
import {
  decryptSecret,
  encryptSecret,
  isSecretEnvelope,
  last4,
} from "./settings.crypto.ts";
import {
  getSettingsByGroup,
  SETTING_DEFINITIONS,
  SETTING_GROUPS,
} from "./settings.registry.ts";
import type {
  AdminSettingField,
  AdminSettingGroup,
  PublicSettings,
  SettingDefinition,
  SettingsAuditQuery,
} from "./types.ts";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: unknown; expiresAt: number }>();
const MEDIA_TYPE_BY_SETTING: Record<string, "site_logo" | "og_image"> = {
  "store.logoUrl": "site_logo",
  "store.ogImageUrl": "og_image",
};

export const clearSettingsCache = () => cache.clear();

const resolveDefault = (definition: SettingDefinition) =>
  typeof definition.defaultValue === "function"
    ? definition.defaultValue()
    : definition.defaultValue;

const parseValue = (definition: SettingDefinition, raw: unknown) => {
  try {
    return definition.schema.parse(raw);
  } catch {
    return definition.schema.parse(resolveDefault(definition));
  }
};

const decodeRowValue = (
  definition: SettingDefinition,
  value: unknown,
): unknown => {
  if (!definition.isSecret) return value;
  if (!isSecretEnvelope(value)) return "";
  try {
    return decryptSecret(definition.key, value);
  } catch {
    return "";
  }
};

export const getSettingValue = async <T = unknown>(key: string): Promise<T> => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const definition = SETTING_DEFINITIONS.get(key);
  if (!definition) throw new AppError(`Unknown setting: ${key}`, 500);

  const row = await withDbRetry(() =>
    prisma.platformSetting.findUnique({ where: { key } }),
  );
  const raw = row ? decodeRowValue(definition, row.value) : resolveDefault(definition);
  const value = parseValue(definition, raw);

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value as T;
};

const toAdminField = (
  definition: SettingDefinition,
  row: { value: unknown } | undefined,
): AdminSettingField => {
  const raw = row ? decodeRowValue(definition, row.value) : resolveDefault(definition);
  const value = parseValue(definition, raw);

  if (definition.isSecret) {
    const plaintext = typeof value === "string" ? value : "";
    return {
      key: definition.key,
      label: definition.label,
      type: definition.type,
      help: definition.help,
      readOnly: definition.readOnly,
      configured: plaintext.length > 0,
      last4: plaintext.length > 0 ? last4(plaintext) : null,
    };
  }

  return {
    key: definition.key,
    label: definition.label,
    type: definition.type,
    help: definition.help,
    options: definition.options,
    readOnly: definition.readOnly,
    value,
  };
};

const buildAdminGroup = async (group: string): Promise<AdminSettingGroup> => {
  const groupDefinition = SETTING_GROUPS.find((item) => item.key === group);
  if (!groupDefinition) throw new AppError("Settings group not found", 404);

  const definitions = getSettingsByGroup(group);
  const rows = await withDbRetry(() =>
    prisma.platformSetting.findMany({
      where: { key: { in: definitions.map((definition) => definition.key) } },
    }),
  );
  const rowByKey = new Map(rows.map((row) => [row.key, row]));

  return {
    key: groupDefinition.key,
    label: groupDefinition.label,
    description: groupDefinition.description,
    fields: definitions.map((definition) =>
      toAdminField(definition, rowByKey.get(definition.key)),
    ),
  };
};

export const getAdminSettings = async (): Promise<AdminSettingGroup[]> =>
  Promise.all(SETTING_GROUPS.map((group) => buildAdminGroup(group.key)));

export const getPublicSettings = async (): Promise<PublicSettings> => {
  const [
    name,
    supportEmail,
    supportPhone,
    address,
    logoUrl,
    ogImageUrl,
    currency,
    enabledMethods,
    taxEnabled,
  ] = await Promise.all([
    getSettingValue<string>("store.name"),
    getSettingValue<string>("store.supportEmail"),
    getSettingValue<string>("store.supportPhone"),
    getSettingValue<string>("store.address"),
    getSettingValue<string>("store.logoUrl"),
    getSettingValue<string>("store.ogImageUrl"),
    getSettingValue<string>("store.currency"),
    getSettingValue<PublicSettings["payment"]["enabledMethods"]>(
      "payment.enabledMethods",
    ),
    getSettingValue<boolean>("checkout.taxEnabled"),
  ]);

  return {
    store: { name, supportEmail, supportPhone, address, logoUrl, ogImageUrl, currency },
    payment: { enabledMethods },
    checkout: { taxEnabled },
  };
};

const auditValue = (definition: SettingDefinition, value: unknown) =>
  definition.isSecret ? "[redacted]" : value;

export const updateSettingsGroup = async (
  group: string,
  values: Record<string, unknown>,
  actorId: string | null,
): Promise<AdminSettingGroup> => {
  const groupDefinition = SETTING_GROUPS.find((item) => item.key === group);
  if (!groupDefinition) throw new AppError("Settings group not found", 404);

  const definitions = getSettingsByGroup(group);
  const definitionByKey = new Map(
    definitions.map((definition) => [definition.key, definition]),
  );

  const entries = Object.entries(values);
  for (const [key] of entries) {
    const definition = definitionByKey.get(key);
    if (!definition) {
      throw new AppError(`Unknown setting for group ${group}: ${key}`, 400);
    }
    if (definition.readOnly) {
      throw new AppError(`${definition.label} cannot be changed`, 400);
    }
  }

  await transaction(async (tx) => {
    const existingRows = await tx.platformSetting.findMany({
      where: { key: { in: entries.map(([key]) => key) } },
    });
    const existingByKey = new Map(existingRows.map((row) => [row.key, row]));

    for (const [key, input] of entries) {
      const definition = definitionByKey.get(key)!;
      const existing = existingByKey.get(key);
      const previousRawValue = existing
        ? decodeRowValue(definition, existing.value)
        : resolveDefault(definition);
      const oldValue = existing
        ? auditValue(definition, previousRawValue)
        : null;

      if (definition.isSecret) {
        if (typeof input !== "string") {
          throw new AppError(`${definition.label} must be a string`, 400);
        }

        if (input === "") {
          if (existing) {
            await tx.platformSetting.delete({ where: { key } });
          }
          await tx.platformSettingAudit.create({
            data: {
              settingKey: key,
              changedBy: actorId,
              oldValue: oldValue as Prisma.InputJsonValue,
              newValue: Prisma.JsonNull,
            },
          });
          continue;
        }

        const encrypted = encryptSecret(key, input) as unknown as Prisma.InputJsonValue;
        await tx.platformSetting.upsert({
          where: { key },
          update: { value: encrypted, isSecret: true, updatedBy: actorId },
          create: { key, value: encrypted, isSecret: true, updatedBy: actorId },
        });
        await tx.platformSettingAudit.create({
          data: {
            settingKey: key,
            changedBy: actorId,
            oldValue: oldValue as Prisma.InputJsonValue,
            newValue: "[redacted]",
          },
        });
        continue;
      }

      const parsed = definition.schema.parse(input);
      const value = parsed as Prisma.InputJsonValue;
      await tx.platformSetting.upsert({
        where: { key },
        update: { value, isSecret: false, updatedBy: actorId },
        create: { key, value, isSecret: false, updatedBy: actorId },
      });
      await tx.platformSettingAudit.create({
        data: {
          settingKey: key,
          changedBy: actorId,
          oldValue: oldValue as Prisma.InputJsonValue,
          newValue: value,
        },
      });

      const expectedMediaType = MEDIA_TYPE_BY_SETTING[key];
      if (expectedMediaType && typeof parsed === "string") {
        const previousPublicId =
          typeof previousRawValue === "string"
            ? extractCloudinaryPublicId(previousRawValue)
            : null;
        const nextPublicId = extractCloudinaryPublicId(parsed);

        if (nextPublicId && nextPublicId !== previousPublicId) {
          const asset = await tx.mediaAsset.findUnique({
            where: { publicId: nextPublicId },
            select: { type: true },
          });
          if (!asset || asset.type !== expectedMediaType) {
            throw new AppError("Uploaded image asset could not be found", 404);
          }
          await attachMediaAssets([nextPublicId], "setting", key, undefined, tx);
        }

        if (previousPublicId && previousPublicId !== nextPublicId) {
          const previousAsset = await tx.mediaAsset.findUnique({
            where: { publicId: previousPublicId },
            select: { entityType: true, entityId: true },
          });
          if (
            previousAsset?.entityType === "setting" &&
            previousAsset.entityId === key
          ) {
            await detachMediaAssets([previousPublicId], tx);
          }
        }
      }
    }
  });

  clearSettingsCache();
  return buildAdminGroup(group);
};

export const listSettingsAudit = async (query: SettingsAuditQuery) => {
  const [items, total] = await Promise.all([
    prisma.platformSettingAudit.findMany({
      orderBy: { changedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.platformSettingAudit.count(),
  ]);

  return { items, pagination: paginate(query.page, query.limit, total) };
};

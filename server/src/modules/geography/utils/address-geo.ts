import { AppError } from "../../../common/errors/AppError.ts";
import { logger } from "../../../common/looger/logger.ts";
import {
  listDistricts,
  listDivisions,
  listUpazilas,
} from "../services/geography.service.ts";

export type AddressGeoInput = {
  divisionCode?: string | null | undefined;
  districtCode?: string | null | undefined;
  upazilaCode?: string | null | undefined;
};

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Verifies that the supplied geography codes form a real division → district →
 * upazila chain. Legacy clients may omit codes; those writes stay valid and are
 * backfilled later. A reference-service outage fails open so checkout and the
 * address book keep working, because names remain the fallback matcher.
 */
export const assertAddressGeoHierarchy = async (
  input: AddressGeoInput
): Promise<void> => {
  const divisionCode = clean(input.divisionCode);
  const districtCode = clean(input.districtCode);
  const upazilaCode = clean(input.upazilaCode);

  if (!divisionCode && !districtCode && !upazilaCode) return;

  if (!divisionCode) {
    throw new AppError(
      "divisionCode is required when a district or upazila code is provided",
      400
    );
  }

  if (upazilaCode && !districtCode) {
    throw new AppError(
      "districtCode is required when an upazila code is provided",
      400
    );
  }

  try {
    const divisions = await listDivisions();
    if (!divisions.some((division) => division.code === divisionCode)) {
      throw new AppError("Invalid division code", 400);
    }

    if (!districtCode) return;

    const districts = await listDistricts(divisionCode);
    const district = districts.find((item) => item.code === districtCode);
    if (!district) {
      throw new AppError(
        "District code does not belong to the selected division",
        400
      );
    }

    if (!upazilaCode) return;

    const upazilas = await listUpazilas(districtCode);
    if (!upazilas.some((item) => item.code === upazilaCode)) {
      throw new AppError(
        "Upazila code does not belong to the selected district",
        400
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;

    logger.warn({
      msg: "Geography validation skipped; reference data unavailable",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

/**
 * Resolves district names (also slugs and aliases) to canonical codes for
 * shipping zones. Returns an empty list on outage; name matching still works.
 */
export const resolveDistrictCodesByName = async (
  names: string[]
): Promise<string[]> => {
  const unique = [...new Set(names.map(normalizeName).filter(Boolean))];
  if (unique.length === 0) return [];

  try {
    const divisions = await listDivisions();
    const districtLists = await Promise.all(
      divisions.map((division) => listDistricts(division.code))
    );

    const byName = new Map<string, string>();
    for (const district of districtLists.flat()) {
      const keys = [
        district.name,
        district.slug,
        ...district.aliases,
      ].filter((value): value is string => Boolean(value));

      for (const key of keys) {
        byName.set(normalizeName(key), district.code);
      }
    }

    return [
      ...new Set(
        unique
          .map((name) => byName.get(name))
          .filter((code): code is string => Boolean(code))
      ),
    ];
  } catch (err) {
    logger.warn({
      msg: "Could not resolve district codes for shipping zone",
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
};

export const normalizeZoneDistrictCodes = (
  codes: string[] | undefined
): string[] =>
  [
    ...new Set(
      (codes ?? [])
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];

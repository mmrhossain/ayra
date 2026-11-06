import { AppError } from "../../../common/errors/AppError.ts";
import { logger } from "../../../common/looger/logger.ts";
import { env } from "../../../config/env.ts";
import type { GeoEntity } from "../types.ts";
import { buildGeoUrl, readGeoList } from "../utils/geography.utils.ts";

type CacheEntry = {
  expiresAt: number;
  data: GeoEntity[];
};

type Loader = () => Promise<GeoEntity[]>;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<GeoEntity[]>>();

const fetchGeoList = async (
  path: string,
  params: Record<string, string | undefined>,
  label: string
): Promise<GeoEntity[]> => {
  const url = buildGeoUrl(env.GEO_API_URL, path, params);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(env.GEO_API_TIMEOUT_MS),
    });
  } catch (err) {
    throw new AppError(
      `${label} reference data is unavailable${
        err instanceof Error ? `: ${err.message}` : ""
      }`,
      502
    );
  }

  if (!response.ok) {
    throw new AppError(
      `${label} reference data request failed (${response.status})`,
      502
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AppError(`${label} reference data returned invalid JSON`, 502);
  }

  const items = readGeoList(payload);
  if (!items) {
    throw new AppError(`${label} reference data had an unexpected shape`, 502);
  }

  return items;
};

/**
 * Small read-through cache in front of the reference service. Concurrent reads
 * share one request, and a failed refresh falls back to the last good snapshot
 * so address forms keep working during a short outage.
 */
const cached = async (key: string, loader: Loader): Promise<GeoEntity[]> => {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.data;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = loader()
    .then((data) => {
      cache.set(key, {
        data,
        expiresAt: Date.now() + env.GEO_CACHE_TTL_SECONDS * 1000,
      });
      return data;
    })
    .catch((err: unknown) => {
      if (hit) {
        logger.warn({
          msg: "Geography service refresh failed; serving stale snapshot",
          key,
          error: err instanceof Error ? err.message : String(err),
        });
        return hit.data;
      }
      throw err;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
};

export const listDivisions = () =>
  cached("divisions", () => fetchGeoList("/divisions", {}, "Division"));

export const listDistricts = (divisionCode: string) =>
  cached(`districts:${divisionCode}`, () =>
    fetchGeoList("/districts", { divisionCode }, "District")
  );

export const listUpazilas = (districtCode: string) =>
  cached(`upazilas:${districtCode}`, () =>
    fetchGeoList("/upazilas", { districtCode }, "Upazila")
  );

export const listUnions = (params: {
  upazilaCode: string;
  districtCode?: string | undefined;
}) =>
  cached(`unions:${params.upazilaCode}:${params.districtCode ?? "all"}`, () =>
    fetchGeoList(
      "/unions",
      { upazilaCode: params.upazilaCode, districtCode: params.districtCode },
      "Union"
    )
  );

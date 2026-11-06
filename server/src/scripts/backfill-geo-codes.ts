import { prisma } from "../lib/prisma.ts";
import type { GeoEntity } from "../modules/geography/types.ts";
import {
  listDistricts,
  listDivisions,
  listUpazilas,
} from "../modules/geography/services/geography.service.ts";
import { resolveDistrictCodesByName } from "../modules/geography/utils/address-geo.ts";

const dryRun =
  process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const namesFor = (entity: GeoEntity): string[] =>
  [entity.name, entity.slug, ...entity.aliases].filter(
    (value): value is string => Boolean(value)
  );

type Counters = {
  scanned: number;
  updated: number;
};

const counters = {
  address: { scanned: 0, updated: 0 } satisfies Counters,
  orderAddress: { scanned: 0, updated: 0 } satisfies Counters,
  shipmentAddress: { scanned: 0, updated: 0 } satisfies Counters,
  shippingZone: { scanned: 0, updated: 0 } satisfies Counters,
};

const unmatched = new Set<string>();

const buildIndex = (items: GeoEntity[], prefix = ""): Map<string, GeoEntity> => {
  const index = new Map<string, GeoEntity>();
  for (const item of items) {
    for (const name of namesFor(item)) {
      index.set(`${prefix}${normalize(name)}`, item);
    }
  }
  return index;
};

const fillCodes = (
  row: {
    divisionCode: string | null;
    districtCode: string | null;
    upazilaCode: string | null;
  },
  match: {
    divisionCode?: string | null | undefined;
    districtCode?: string | null | undefined;
    upazilaCode?: string | null | undefined;
  }
) => {
  const data: {
    divisionCode?: string;
    districtCode?: string;
    upazilaCode?: string;
  } = {};

  if (!row.divisionCode && match.divisionCode) {
    data.divisionCode = match.divisionCode;
  }
  if (!row.districtCode && match.districtCode) {
    data.districtCode = match.districtCode;
  }
  if (!row.upazilaCode && match.upazilaCode) {
    data.upazilaCode = match.upazilaCode;
  }

  return data;
};

async function main() {
  console.log(
    dryRun
      ? "Geo code backfill (dry run; no rows will be written)"
      : "Geo code backfill"
  );

  const [divisions, addresses, orderAddresses, shipmentAddresses, zones] =
    await Promise.all([
      listDivisions(),
      prisma.address.findMany({
        select: {
          id: true,
          division: true,
          district: true,
          thana: true,
          divisionCode: true,
          districtCode: true,
          upazilaCode: true,
        },
      }),
      prisma.orderAddress.findMany({
        select: {
          id: true,
          division: true,
          district: true,
          thana: true,
          divisionCode: true,
          districtCode: true,
          upazilaCode: true,
        },
      }),
      prisma.shipmentAddress.findMany({
        select: {
          id: true,
          state: true,
          city: true,
          area: true,
          divisionCode: true,
          districtCode: true,
          upazilaCode: true,
        },
      }),
      prisma.shippingZone.findMany({
        select: { id: true, matchDistricts: true, matchDistrictCodes: true },
      }),
    ]);

  const divisionIndex = buildIndex(divisions);

  const districtLists = await Promise.all(
    divisions.map((division) => listDistricts(division.code))
  );
  const districtIndex = new Map<string, GeoEntity>();
for (const [index, division] of divisions.entries()) {
  const scoped = buildIndex(districtLists[index] ?? [], `${division.code}|`);
  for (const [key, value] of scoped) districtIndex.set(key, value);
}

  const districtOf = (divisionCode: string | null, name: string) => {
    if (divisionCode) {
      const scoped = districtIndex.get(`${divisionCode}|${normalize(name)}`);
      if (scoped) return scoped;
    }
    const global = [...districtIndex.entries()].find(
      ([, district]) =>
        district.code !== undefined &&
        namesFor(district).some((key) => normalize(key) === normalize(name))
    );
    return global?.[1];
  };

  type ResolvedMatch = {
    divisionCode?: string;
    districtCode?: string;
    thana?: string | null;
  };

  const resolveRow = (
    division: string,
    district: string,
    thana?: string | null
  ): ResolvedMatch => {
    const divisionEntity = divisionIndex.get(normalize(division));
    if (!divisionEntity) {
      unmatched.add(`division:${division}`);
      return {};
    }

    const districtEntity = districtOf(divisionEntity.code, district);
    if (!districtEntity) {
      unmatched.add(`district:${division}/${district}`);
      return { divisionCode: divisionEntity.code };
    }

    return {
      divisionCode: divisionEntity.code,
      districtCode: districtEntity.code,
      thana: thana ?? null,
    };
  };

  const resolved = [
    ...addresses.map((row) => ({
      kind: "address" as const,
      row,
      match: resolveRow(row.division, row.district, row.thana),
    })),
    ...orderAddresses.map((row) => ({
      kind: "orderAddress" as const,
      row,
      match: resolveRow(row.division, row.district, row.thana),
    })),
    ...shipmentAddresses.map((row) => ({
      kind: "shipmentAddress" as const,
      row,
      match: resolveRow(row.state ?? "", row.city, row.area),
    })),
  ];

  const neededDistrictCodes = [
    ...new Set(
      resolved
        .map(({ match }) => match.districtCode)
        .filter((code): code is string => Boolean(code))
    ),
  ];

  const upazilaIndex = new Map<string, GeoEntity>();
  for (const districtCode of neededDistrictCodes) {
    const upazilas = await listUpazilas(districtCode);
    for (const upazila of upazilas) {
      for (const name of namesFor(upazila)) {
        upazilaIndex.set(`${districtCode}|${normalize(name)}`, upazila);
      }
    }
  }

  for (const { kind, row, match } of resolved) {
    counters[kind].scanned += 1;

    const upazila =
      match.thana && match.districtCode
        ? upazilaIndex.get(`${match.districtCode}|${normalize(match.thana)}`)
        : undefined;

    const data = fillCodes(row, {
      divisionCode: match.divisionCode,
      districtCode: match.districtCode,
      upazilaCode: upazila?.code,
    });

    if (Object.keys(data).length === 0) continue;

    counters[kind].updated += 1;
    if (!dryRun) {
      if (kind === "address") {
        await prisma.address.update({ where: { id: row.id }, data });
      } else if (kind === "orderAddress") {
        await prisma.orderAddress.update({ where: { id: row.id }, data });
      } else {
        await prisma.shipmentAddress.update({ where: { id: row.id }, data });
      }
    }
  }

  for (const zone of zones) {
    counters.shippingZone.scanned += 1;
    if (zone.matchDistricts.length === 0) continue;

    const resolvedCodes = await resolveDistrictCodesByName(zone.matchDistricts);
    const nextCodes = [
      ...new Set([...zone.matchDistrictCodes, ...resolvedCodes]),
    ].sort();
    const current = [...zone.matchDistrictCodes].sort();

    if (nextCodes.join("|") === current.join("|")) continue;

    counters.shippingZone.updated += 1;
    if (!dryRun) {
      await prisma.shippingZone.update({
        where: { id: zone.id },
        data: { matchDistrictCodes: nextCodes },
      });
    }
  }

  console.log(JSON.stringify({ dryRun, counters }, null, 2));

  if (unmatched.size > 0) {
    console.warn(
      `\nUnmatched geography names (${unmatched.size}). Review before relying on codes:\n` +
        [...unmatched].slice(0, 50).join("\n")
    );
  }
}

main()
  .catch((err) => {
    console.error("Geo code backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

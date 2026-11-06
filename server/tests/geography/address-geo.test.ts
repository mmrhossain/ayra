import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/common/errors/AppError.ts";
import {
  assertAddressGeoHierarchy,
  normalizeZoneDistrictCodes,
  resolveDistrictCodesByName,
} from "../../src/modules/geography/utils/address-geo.ts";
import type { GeoEntity } from "../../src/modules/geography/types.ts";

vi.mock("../../src/modules/geography/services/geography.service.ts", () => ({
  listDivisions: vi.fn(),
  listDistricts: vi.fn(),
  listUpazilas: vi.fn(),
}));

const geography = await import(
  "../../src/modules/geography/services/geography.service.ts"
);

const entity = (value: Partial<GeoEntity> & { code: string; name: string }) => ({
  code: value.code,
  name: value.name,
  bnName: null,
  slug: value.slug ?? null,
  aliases: value.aliases ?? [],
  divisionCode: value.divisionCode ?? null,
  districtCode: value.districtCode ?? null,
  upazilaCode: value.upazilaCode ?? null,
});

const divisions = [
  entity({ code: "BD-13", name: "Dhaka", slug: "dhaka" }),
  entity({ code: "BD-61", name: "Barishal" }),
];

const district = entity({
  code: "D-47",
  name: "Dhaka",
  slug: "dhaka",
  divisionCode: "BD-13",
});

const upazila = entity({
  code: "U-0001",
  name: "Savar",
  districtCode: "D-47",
  divisionCode: "BD-13",
});

beforeEach(() => {
  vi.mocked(geography.listDivisions).mockResolvedValue(divisions);
  vi.mocked(geography.listDistricts).mockResolvedValue([district]);
  vi.mocked(geography.listUpazilas).mockResolvedValue([upazila]);
});

describe("assertAddressGeoHierarchy", () => {
  it("accepts legacy addresses without codes", async () => {
    await expect(assertAddressGeoHierarchy({})).resolves.toBeUndefined();
    expect(geography.listDivisions).not.toHaveBeenCalled();
  });

  it("requires a division code before district or upazila codes", async () => {
    await expect(
      assertAddressGeoHierarchy({ districtCode: "D-47" })
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      assertAddressGeoHierarchy({ upazilaCode: "U-0001" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("accepts a valid division and district chain", async () => {
    await assertAddressGeoHierarchy({
      divisionCode: "BD-13",
      districtCode: "D-47",
    });

    expect(geography.listDistricts).toHaveBeenCalledWith("BD-13");
    expect(geography.listUpazilas).not.toHaveBeenCalled();
  });

  it("accepts a valid upazila under its district", async () => {
    await assertAddressGeoHierarchy({
      divisionCode: "BD-13",
      districtCode: "D-47",
      upazilaCode: "U-0001",
    });

    expect(geography.listUpazilas).toHaveBeenCalledWith("D-47");
  });

  it("rejects a district outside the selected division", async () => {
    await expect(
      assertAddressGeoHierarchy({
        divisionCode: "BD-13",
        districtCode: "D-99",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an upazila outside the selected district", async () => {
    await expect(
      assertAddressGeoHierarchy({
        divisionCode: "BD-13",
        districtCode: "D-47",
        upazilaCode: "U-9999",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("fails open when the reference service is unavailable", async () => {
    vi.mocked(geography.listDivisions).mockRejectedValue(
      new Error("connect ECONNREFUSED")
    );

    await expect(
      assertAddressGeoHierarchy({
        divisionCode: "BD-13",
        districtCode: "D-47",
      })
    ).resolves.toBeUndefined();
  });
});

describe("resolveDistrictCodesByName", () => {
  it("resolves names, slugs, and aliases to district codes", async () => {
    vi.mocked(geography.listDistricts).mockResolvedValue([
      district,
      entity({
        code: "D-63",
        name: "Chattogram",
        slug: "chattogram",
        aliases: ["Chittagong"],
        divisionCode: "BD-13",
      }),
    ]);

    await expect(
      resolveDistrictCodesByName(["Dhaka", "chittagong", "Chattogram"])
    ).resolves.toEqual(["D-47", "D-63"]);
  });

  it("returns an empty list during a reference-service outage", async () => {
    vi.mocked(geography.listDivisions).mockRejectedValue(new Error("timeout"));

    await expect(resolveDistrictCodesByName(["Dhaka"])).resolves.toEqual([]);
  });

  it("normalizes explicit zone codes", () => {
    expect(normalizeZoneDistrictCodes([" d-47 ", "D-47", ""])).toEqual([
      "D-47",
    ]);
  });
});

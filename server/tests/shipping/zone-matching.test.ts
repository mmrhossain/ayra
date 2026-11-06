import { describe, expect, it } from "vitest";
import { zoneMatchesDistrict } from "../../src/modules/shipping/services/shipping.service.ts";

const zone = (
  matchDistricts: string[] = [],
  matchDistrictCodes: string[] = []
) => ({ matchDistricts, matchDistrictCodes });

describe("shipping zone district matching", () => {
  it("matches on the canonical district code", () => {
    expect(
      zoneMatchesDistrict(zone([], ["D-47"]), {
        district: "Some legacy spelling",
        districtCode: "d-47",
      })
    ).toBe(true);
  });

  it("prefers the code when it matches", () => {
    expect(
      zoneMatchesDistrict(zone(["Chattogram"], ["D-47"]), {
        district: "Dhaka",
        districtCode: "D-47",
      })
    ).toBe(true);
  });

  it("falls back to the district name for legacy addresses", () => {
    expect(
      zoneMatchesDistrict(zone(["Dhaka"]), { district: " dhaka " })
    ).toBe(true);
  });

  it("does not match when neither code nor name matches", () => {
    expect(
      zoneMatchesDistrict(zone(["Dhaka"], ["D-47"]), {
        district: "Chattogram",
        districtCode: "D-63",
      })
    ).toBe(false);
  });

  it("does not match an empty address", () => {
    expect(zoneMatchesDistrict(zone(["Dhaka"]), {})).toBe(false);
  });
});

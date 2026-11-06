import { describe, expect, it } from "vitest";
import {
  buildGeoUrl,
  readGeoList,
  toGeoEntity,
} from "../../src/modules/geography/utils/geography.utils.ts";

describe("Geography utils", () => {
  it("maps reference-service records and drops deprecated ones", () => {
    const items = readGeoList({
      status: "success",
      data: [
        {
          code: "D-47",
          name: "Dhaka",
          bn_name: "ঢাকা",
          slug: "dhaka",
          aliases: ["Dacca"],
          divisionCode: "BD-13",
          deprecated_at: null,
        },
        { code: "D-99", name: "Retired", deprecated_at: "2026-01-01T00:00:00Z" },
        { code: "", name: "Broken" },
        "not-a-record",
      ],
    });

    expect(items).toHaveLength(1);
    expect(items?.[0]).toMatchObject({
      code: "D-47",
      name: "Dhaka",
      bnName: "ঢাকা",
      divisionCode: "BD-13",
      districtCode: null,
    });
  });

  it("rejects payloads without a data array", () => {
    expect(readGeoList({ status: "fail" })).toBeNull();
    expect(readGeoList(null)).toBeNull();
  });

  it("keeps records without a bn_name but requires a code and name", () => {
    expect(toGeoEntity({ code: "BD-13", name: "Dhaka" })).toMatchObject({
      bnName: null,
      aliases: [],
    });
    expect(toGeoEntity({ name: "Dhaka" })).toBeNull();
  });

  it("builds urls from the base without doubling slashes", () => {
    const url = buildGeoUrl("https://geo.test/api/v1/", "/districts", {
      divisionCode: "BD-13",
      upazilaCode: undefined,
    });

    expect(url).toBe(
      "https://geo.test/api/v1/districts?divisionCode=BD-13",
    );
  });
});

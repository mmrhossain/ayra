import { describe, expect, it } from "vitest";
import { toOrderAddress } from "../../src/modules/order/utils/order-helpers.ts";

const base = {
  fullName: "Test Customer",
  phone: "01700000000",
  email: "test@example.com",
  country: "Bangladesh",
  division: "Dhaka",
  district: "Dhaka",
  thana: "Savar",
  postalCode: "1340",
  addressLine1: "1 Test Road",
  addressLine2: "Apt 2",
};

describe("toOrderAddress", () => {
  it("snapshots geography codes onto the order address", () => {
    const result = toOrderAddress(
      {
        ...base,
        divisionCode: "BD-13",
        districtCode: "D-47",
        upazilaCode: "U-0001",
      },
      "SHIPPING"
    );

    expect(result).toMatchObject({
      type: "SHIPPING",
      divisionCode: "BD-13",
      districtCode: "D-47",
      upazilaCode: "U-0001",
    });
  });

  it("keeps legacy addresses valid with null codes", () => {
    expect(toOrderAddress(base, "BILLING")).toMatchObject({
      divisionCode: null,
      districtCode: null,
      upazilaCode: null,
    });
  });
});

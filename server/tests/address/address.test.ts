import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const addressPayload = {
  fullName: "Rahim Uddin",
  phone: "01712345678",
  division: "Dhaka",
  district: "Dhaka",
  thana: "Mirpur",
  addressLine1: "House 12, Road 5",
};

describe("Address ownership", () => {
  it("returns 404 when fetching another user's address", async () => {
    const owner = await createTestUser(tracker, { suffix: `ao-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `at-${Date.now()}` });

    const created = await api()
      .post("/api/v1/addresses")
      .set("Cookie", owner.cookie)
      .send(addressPayload);

    expect(created.status).toBe(201);
    const addressId = created.body.data.id as string;

    const res = await api()
      .get(`/api/v1/addresses/${addressId}`)
      .set("Cookie", other.cookie);

    expect(res.status).toBe(404);
  });

  it("returns 404 when updating or deleting another user's address", async () => {
    const owner = await createTestUser(tracker, { suffix: `au-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `ad-${Date.now()}` });

    const created = await api()
      .post("/api/v1/addresses")
      .set("Cookie", owner.cookie)
      .send(addressPayload);

    expect(created.status).toBe(201);
    const addressId = created.body.data.id as string;

    const updateRes = await api()
      .put(`/api/v1/addresses/${addressId}`)
      .set("Cookie", other.cookie)
      .send({ fullName: "Hacker" });
    expect(updateRes.status).toBe(404);

    const deleteRes = await api()
      .delete(`/api/v1/addresses/${addressId}`)
      .set("Cookie", other.cookie);
    expect(deleteRes.status).toBe(404);
  });

  it("lists only the authenticated user's addresses", async () => {
    const owner = await createTestUser(tracker, { suffix: `al-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `ax-${Date.now()}` });

    await api()
      .post("/api/v1/addresses")
      .set("Cookie", owner.cookie)
      .send(addressPayload);
    await api()
      .post("/api/v1/addresses")
      .set("Cookie", other.cookie)
      .send({ ...addressPayload, phone: "01812345678" });

    const res = await api()
      .get("/api/v1/addresses")
      .set("Cookie", owner.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].phone).toBe("01712345678");
  });

  it("rejects invalid Bangladesh phone numbers", async () => {
    const user = await createTestUser(tracker, { suffix: `ap-${Date.now()}` });

    const res = await api()
      .post("/api/v1/addresses")
      .set("Cookie", user.cookie)
      .send({ ...addressPayload, phone: "12345" });

    expect(res.status).toBe(400);
  });
});

describe("Address default flags", () => {
  it("keeps a single default shipping address under concurrent updates", async () => {
    const user = await createTestUser(tracker, { suffix: `df-${Date.now()}` });

    const created = await Promise.all(
      [1, 2, 3].map((n) =>
        api()
          .post("/api/v1/addresses")
          .set("Cookie", user.cookie)
          .send({
            ...addressPayload,
            phone: `0171234567${n}`,
            addressLine1: `House ${n}`,
          })
      )
    );

    for (const res of created) {
      expect(res.status).toBe(201);
    }

    const ids = created.map((r) => r.body.data.id as string);

    const results = await Promise.all(
      ids.map((id) =>
        api()
          .put(`/api/v1/addresses/${id}`)
          .set("Cookie", user.cookie)
          .send({ isDefaultShipping: true })
      )
    );

    for (const res of results) {
      expect(res.status).toBe(200);
    }

    const defaults = await prisma.address.findMany({
      where: { customerProfileId: user.customerProfileId, isDefaultShipping: true },
    });

    expect(defaults).toHaveLength(1);
  });

  it("keeps a single default billing address under concurrent creates", async () => {
    const user = await createTestUser(tracker, { suffix: `db-${Date.now()}` });

    const results = await Promise.all(
      [1, 2, 3].map((n) =>
        api()
          .post("/api/v1/addresses")
          .set("Cookie", user.cookie)
          .send({
            ...addressPayload,
            phone: `0181234567${n}`,
            addressLine1: `Billing ${n}`,
            isDefaultBilling: true,
          })
      )
    );

    for (const res of results) {
      expect(res.status).toBe(201);
    }

    const defaults = await prisma.address.findMany({
      where: { customerProfileId: user.customerProfileId, isDefaultBilling: true },
    });

    expect(defaults).toHaveLength(1);
  });
});

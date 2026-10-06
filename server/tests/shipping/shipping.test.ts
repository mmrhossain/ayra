import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestUser,
  ensureDefaultShippingCatalog,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
  await ensureDefaultShippingCatalog();
});

describe("Shipping admin CRUD", () => {
  it("forbids shipping mutations without admin role", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `shc-${Date.now()}`,
    });

    const unauth = await api().get("/api/v1/admin/shipping/zones");
    expect([401, 403]).toContain(unauth.status);

    const customerList = await api()
      .get("/api/v1/admin/shipping/zones")
      .set("Cookie", customer.cookie);
    expect(customerList.status).toBe(403);
  });

  it("creates zones, methods, and rates and rejects duplicates", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `sha-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);

    const zone = await api()
      .post("/api/v1/admin/shipping/zones")
      .set("Cookie", admin.cookie)
      .send({
        name: `Zone ${tag}`,
        code: `ZONE_${tag}`,
        isActive: true,
        matchDistricts: ["Khulna"],
      });
    expect(zone.status).toBe(201);

    const dupZone = await api()
      .post("/api/v1/admin/shipping/zones")
      .set("Cookie", admin.cookie)
      .send({
        name: `Zone ${tag}`,
        code: `ZONE_${tag}`,
        isActive: true,
      });
    expect(dupZone.status).toBe(409);

    const method = await api()
      .post("/api/v1/admin/shipping/methods")
      .set("Cookie", admin.cookie)
      .send({
        name: `Method ${tag}`,
        code: `METHOD_${tag}`,
        isActive: true,
      });
    expect(method.status).toBe(201);

    const rate = await api()
      .post("/api/v1/admin/shipping/rates")
      .set("Cookie", admin.cookie)
      .send({
        shippingZoneId: zone.body.data.id,
        shippingMethodId: method.body.data.id,
        price: 75,
        freeShippingFrom: 500,
        isActive: true,
      });
    expect(rate.status).toBe(201);
    expect(Number(rate.body.data.price)).toBe(75);

    const dupRate = await api()
      .post("/api/v1/admin/shipping/rates")
      .set("Cookie", admin.cookie)
      .send({
        shippingZoneId: zone.body.data.id,
        shippingMethodId: method.body.data.id,
        price: 80,
      });
    expect(dupRate.status).toBe(409);

    const negative = await api()
      .post("/api/v1/admin/shipping/rates")
      .set("Cookie", admin.cookie)
      .send({
        shippingZoneId: zone.body.data.id,
        shippingMethodId: method.body.data.id,
        price: -10,
      });
    expect(negative.status).toBe(400);

    await prisma.shippingRate.delete({ where: { id: rate.body.data.id } });
    await prisma.shippingMethod.delete({ where: { id: method.body.data.id } });
    await prisma.shippingZone.delete({ where: { id: zone.body.data.id } });
  });
});

describe("Customer shipping options", () => {
  it("returns Inside Dhaka options from the delivery district", async () => {
    const user = await createTestUser(tracker, { suffix: `sho-${Date.now()}` });
    await ensureDefaultShippingCatalog();

    const res = await api()
      .get("/api/v1/shipping/options")
      .query({ district: "Dhaka", subtotal: 100 })
      .set("Cookie", user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.zone.code).toBe("INSIDE_DHAKA");
    const codes = (res.body.data.options as Array<{ methodCode: string; shippingAmount: number }>)
      .map((o) => o.methodCode)
      .sort();
    expect(codes).toEqual(["EXPRESS", "STANDARD"]);
  });

  it("quotes Outside Dhaka express from the backend", async () => {
    const user = await createTestUser(tracker, { suffix: `shq-${Date.now()}` });

    const res = await api()
      .post("/api/v1/shipping/quote")
      .set("Cookie", user.cookie)
      .send({
        shippingMethodCode: "EXPRESS",
        shippingAddress: {
          fullName: "Test Buyer",
          phone: "01700000000",
          country: "Bangladesh",
          division: "Dhaka",
          district: "Gazipur",
          addressLine1: "12 Test Avenue",
        },
        subtotal: 100,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.zoneCode).toBe("OUTSIDE_DHAKA");
    expect(res.body.data.methodCode).toBe("EXPRESS");
    expect(res.body.data.shippingAmount).toBe(200);
  });
});

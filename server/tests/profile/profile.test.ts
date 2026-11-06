import { afterEach, describe, expect, it } from "vitest";
import {
  CleanupTracker,
  api,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("Customer profile", () => {
  it("gets or creates a profile", async () => {
    const user = await createTestUser(tracker, { suffix: `cg-${Date.now()}` });

    const res = await api()
      .get("/api/v1/customer/profile")
      .set("Cookie", user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.customerCode).toBeTruthy();
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.user.email).toBeTruthy();
    expect(res.body.data.gender).toBeNull();
  });

  it("saves dateOfBirth and gender on create or update", async () => {
    const user = await createTestUser(tracker, { suffix: `cp-${Date.now()}` });

    const created = await api()
      .patch("/api/v1/customer/profile")
      .set("Cookie", user.cookie)
      .send({ dateOfBirth: "1995-06-15", gender: "MALE" });

    expect(created.status).toBe(200);
    expect(created.body.data.gender).toBe("MALE");
    expect(created.body.data.dateOfBirth).toBeTruthy();

    const updated = await api()
      .patch("/api/v1/customer/profile")
      .set("Cookie", user.cookie)
      .send({ gender: "FEMALE" });

    expect(updated.status).toBe(200);
    expect(updated.body.data.gender).toBe("FEMALE");
    expect(updated.body.data.id).toBe(created.body.data.id);
  });
});

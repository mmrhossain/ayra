import { describe, expect, it } from "vitest";
import { api } from "../helpers/index.ts";

describe("request id", () => {
  it("echoes X-Request-Id on health", async () => {
    const incoming = "req-test-health-1";
    const res = await api().get("/health").set("X-Request-Id", incoming);
    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBe(incoming);
  });

  it("includes requestId on 404 body and header", async () => {
    const incoming = "req-test-missing-1";
    const res = await api()
      .get("/api/v1/this-route-does-not-exist")
      .set("X-Request-Id", incoming);
    expect(res.status).toBe(404);
    expect(res.headers["x-request-id"]).toBe(incoming);
    expect(res.body.requestId).toBe(incoming);
    expect(res.body.message).toBe("Route not found");
  });
});

import { describe, expect, it } from "vitest";
import { buildPgPoolConfig } from "../../src/lib/pg-pool-config.ts";

describe("buildPgPoolConfig", () => {
  it("applies a query timeout so hung/dead-socket queries fail fast instead of blocking forever", () => {
    const config = buildPgPoolConfig({
      connectionString: "postgres://user:pass@host:5432/db",
      max: 20,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
      queryTimeoutMillis: 30_000,
      keepAliveInitialDelayMillis: 10_000,
    });

    // Regression guard: without query_timeout a query on a stale connection (e.g. after a
    // Wi-Fi switch) hangs for minutes, so the pool never evicts the socket and Neon never wakes.
    expect(config.query_timeout).toBe(30_000);
  });

  it("forwards every tuning value to the pg pool config", () => {
    const config = buildPgPoolConfig({
      connectionString: "postgres://user:pass@host:5432/db",
      max: 7,
      connectionTimeoutMillis: 11_000,
      idleTimeoutMillis: 12_000,
      queryTimeoutMillis: 13_000,
      keepAliveInitialDelayMillis: 14_000,
    });

    expect(config).toMatchObject({
      connectionString: "postgres://user:pass@host:5432/db",
      max: 7,
      connectionTimeoutMillis: 11_000,
      idleTimeoutMillis: 12_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 14_000,
      query_timeout: 13_000,
    });
  });
});

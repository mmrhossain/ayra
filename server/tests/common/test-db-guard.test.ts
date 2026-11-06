import { describe, expect, it } from "vitest";
import { assertSafeTestDatabase } from "../helpers/test-db.ts";

describe("assertSafeTestDatabase", () => {
  it("accepts a database whose name contains test", () => {
    expect(() =>
      assertSafeTestDatabase("postgresql://u:p@localhost:5432/ayra_test")
    ).not.toThrow();
  });

  it("rejects a non-test database", () => {
    expect(() =>
      assertSafeTestDatabase("postgresql://u:p@localhost:5432/ayra")
    ).toThrow(/Refusing to run database setup/);
  });

  it("allows an override", () => {
    expect(() =>
      assertSafeTestDatabase("postgresql://u:p@localhost:5432/ayra", {
        allowNonTestDb: true,
      })
    ).not.toThrow();
  });

  it("rejects a missing or invalid URL without leaking credentials", () => {
    expect(() => assertSafeTestDatabase(undefined)).toThrow(/DATABASE_URL/);
    expect(() => assertSafeTestDatabase("not a url")).toThrow(/valid URL/);
  });
});

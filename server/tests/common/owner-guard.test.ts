import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { OWNER_GUARD_LOCK_KEY } from "../../src/lib/owner-guard.ts";

const triggerMigration = fileURLToPath(
  new URL(
    "../../prisma/migrations/20261102022000_owner_guard_trigger/migration.sql",
    import.meta.url,
  ),
);

describe("owner guard advisory lock", () => {
  it("uses the same advisory lock key as the last-super-admin trigger", () => {
    const sql = readFileSync(triggerMigration, "utf8");
    const match = sql.match(/pg_advisory_xact_lock\((\d+)::bigint\)/);
    expect(match?.[1]).toBeDefined();

    const triggerKey = BigInt(match![1]!);
    expect(OWNER_GUARD_LOCK_KEY).toBe(triggerKey);
  });

  it("keeps the key precise (exceeds Number.MAX_SAFE_INTEGER)", () => {
    // Guards against reintroducing the hex-number literal that lost precision.
    expect(OWNER_GUARD_LOCK_KEY > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(Number(OWNER_GUARD_LOCK_KEY)).not.toBe(
      Number(BigInt("0x417972614f776e65")),
    );
  });
});

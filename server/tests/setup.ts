import { mkdirSync } from "node:fs";
import { assertSafeTestDatabase } from "./helpers/test-db.ts";
import { ensureDefaultShippingCatalog } from "./helpers/shipping.ts";
import { withDbRetry } from "../src/common/utils/db-retry.ts";

mkdirSync("logs", { recursive: true });
process.env.NODE_ENV = "test";

// SKIP_DB_SETUP lets pure unit tests run without a reachable database.
try {
  if (!process.env.SKIP_DB_SETUP) {
    assertSafeTestDatabase(process.env.DATABASE_URL, {
      allowNonTestDb: process.env.ALLOW_NON_TEST_DB === "1",
    });
    await withDbRetry(() => ensureDefaultShippingCatalog(), 5);
  }
} catch (err) {
  console.error("Database test setup failed", err);
  throw err;
}

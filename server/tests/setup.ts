import { mkdirSync } from "node:fs";
import { ensureDefaultShippingCatalog } from "./helpers/shipping.ts";

mkdirSync("logs", { recursive: true });
process.env.NODE_ENV = "test";

try {
  await ensureDefaultShippingCatalog();
} catch (err) {
  console.error("ensureDefaultShippingCatalog failed", err);
  throw err;
}

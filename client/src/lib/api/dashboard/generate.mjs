import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const localSpec = process.env.BACKEND_OPENAPI_JSON || resolve(rootDir, "openapi-dashboard.json");
const origin = process.env.BACKEND_ORIGIN?.trim().replace(/\/+$/, "");

let specUrl;
let spec;

if (existsSync(localSpec)) {
  specUrl = pathToFileURL(resolve(localSpec)).href;
  console.log(`Reading OpenAPI spec from ${specUrl} ...`);
  spec = JSON.parse(readFileSync(localSpec, "utf8"));
} else if (origin && !origin.startsWith("/")) {
  specUrl = `${origin}/api-docs.json`;
  console.log(`Fetching OpenAPI spec from ${specUrl} ...`);

  const response = await fetch(specUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${specUrl}: HTTP ${response.status} ${response.statusText}`);
  }

  spec = await response.json();
} else {
  console.error(
    "OpenAPI spec not found. Set BACKEND_OPENAPI_JSON to a local file or set BACKEND_ORIGIN."
  );
  process.exit(1);
}

const outputPath = resolve(rootDir, "src/lib/api/dashboard/types.ts");

console.log("Generating dashboard API types ...");
const types = await openapiTS(spec, {
  exportType: true,
  commentHeader: `/* eslint-disable */\n/* Auto-generated from ${specUrl} */\n`,
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, astToString(types));
console.log(`Wrote ${outputPath}`);

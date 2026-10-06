#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const localSpec =
  process.env.BACKEND_OPENAPI_JSON ||
  resolve(rootDir, "openapi-dashboard.json");
const origin =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL;

let specUrl;
let spec;

if (existsSync(localSpec)) {
  specUrl = `file://${localSpec}`;
  console.log(`Reading OpenAPI spec from ${specUrl} ...`);
  spec = JSON.parse(readFileSync(localSpec, "utf8"));
} else if (origin && !origin.startsWith("/")) {
  specUrl = `${origin.replace(/\/$/, "")}/api-docs.json`;
  console.log(`Fetching OpenAPI spec from ${specUrl} ...`);
  const res = await fetch(specUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  spec = await res.json();
} else {
  console.error(
    "Error: no local spec (openapi-dashboard.json) and no reachable origin."
  );
  process.exit(1);
}

const outputPath = resolve(rootDir, "src/lib/api/dashboard/types.ts");
console.log("Generating dashboard API types ...");
const types = await openapiTS(spec, {
  exportType: true,
  commentHeader: `/* eslint-disable */\n/* auto-generated from ${specUrl} */\n`,
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, astToString(types));
console.log(`Wrote ${outputPath}`);

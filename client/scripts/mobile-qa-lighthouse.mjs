import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const separator = arg.indexOf("=");
  if (!arg.startsWith("--") || separator < 0) throw new Error("Use --option=value arguments.");
  return [arg.slice(2, separator), arg.slice(separator + 1)];
}));
const base = new URL(args["base-url"] || process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3001");
const runs = Number(args.runs || 3);
if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error("--runs must be between 1 and 10.");
const routes = (args.paths || "/,/shop").split(",");
const output = path.resolve(process.env.LIGHTHOUSE_OUTPUT_DIR || "reports/lighthouse");
fs.mkdirSync(output, { recursive: true });
const response = await fetch(base, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error("Audit server returned HTTP " + response.status);
const html = await response.text();
if (/next-devtools|next_dist_compiled_next-devtools|next_dist_compiled_react-refresh/.test(html)) {
  throw new Error("Use a production build: npm run build, then npm run start -- -p 3001.");
}
if (!process.env.CHROME_PATH && process.platform === "win32") {
  const edge = [
    path.join(process.env["ProgramFiles(x86)"] || "", "Microsoft/Edge/Application/msedge.exe"),
    path.join(process.env.ProgramFiles || "", "Microsoft/Edge/Application/msedge.exe"),
  ].find(candidate => fs.existsSync(candidate));
  if (edge) process.env.CHROME_PATH = edge;
}
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run using npm run qa:lighthouse:mobile.");
async function assertBackendAvailable() {
  const endpoint = new URL("/backend-proxy/api/v1/settings/public", base);
  const check = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
  if (check.status === 429) {
    throw new Error("Backend rate limit reached. Wait for its window to reset before auditing; fallback pages cannot give reliable scores. Retry-After: " + check.headers.get("retry-after") + ", RateLimit-Reset: " + check.headers.get("ratelimit-reset"));
  }
  if (!check.ok) throw new Error("Backend preflight failed: HTTP " + check.status);
  await check.arrayBuffer();
}
await assertBackendAvailable();
const results = [];
for (const route of routes) {
  const url = new URL(route, base);
  if (url.origin !== base.origin || !route.startsWith("/")) throw new Error("Audit paths must belong to the base URL.");
  for (let run = 1; run <= runs; run++) {
    const label = (url.pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home") + "-" + run;
    const outputPath = path.join(output, label);
    console.log("Mobile Lighthouse: " + url.pathname + " (" + run + "/" + runs + ")");
    const result = spawnSync(process.execPath, [
      npmCli, "exec", "--yes", "--package=lighthouse@13.6.0", "--", "lighthouse", url.href,
      "--only-categories=performance", "--form-factor=mobile",
      "--chrome-flags=--headless=new --no-first-run --no-default-browser-check",
      "--output=html", "--output=json", "--output-path=" + outputPath, "--quiet",
    ], { stdio: "inherit", env: process.env });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
    const report = JSON.parse(fs.readFileSync(outputPath + ".report.json", "utf8"));
    if (report.runtimeError) throw new Error(report.runtimeError.message);
    await assertBackendAvailable();
    results.push({
      path: url.pathname, run,
      score: Math.round(report.categories.performance.score * 100),
      lcpMs: Math.round(report.audits["largest-contentful-paint"].numericValue),
      cls: report.audits["cumulative-layout-shift"].numericValue,
      tbtMs: Math.round(report.audits["total-blocking-time"].numericValue),
    });
    fs.writeFileSync(path.join(output, "summary.json"), JSON.stringify(results, null, 2));
  }
}
console.table(results);
console.log("Reports saved to " + output);

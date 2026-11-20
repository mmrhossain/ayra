import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const options = Object.fromEntries(process.argv.slice(2).map(argument => {
  const split = argument.indexOf("=");
  if (!argument.startsWith("--") || split < 0) throw new Error("Use --option=value.");
  return [argument.slice(2, split), argument.slice(split + 1)];
}));
const base = new URL(options["base-url"] || process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3001");
const routes = (options.paths || "/,/shop").split(",");
const runs = Number(options.runs || 3);
if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error("--runs must be 1 to 10.");
const output = path.resolve(process.env.LIGHTHOUSE_OUTPUT_DIR || "reports/lighthouse");
fs.mkdirSync(output, { recursive: true });
async function verifyBackend() {
  const response = await fetch(new URL("/backend-proxy/api/v1/settings/public", base), { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error("Backend HTTP " + response.status + ". Wait for recovery/rate-limit reset before measuring.");
  await response.arrayBuffer();
}
await verifyBackend();
const response = await fetch(base, { signal: AbortSignal.timeout(30_000) });
const html = await response.text();
if (!response.ok || /next-devtools|next_dist_compiled_react-refresh/.test(html)) {
  throw new Error("Run an available production build, not next dev.");
}
if (process.platform === "win32" && !process.env.CHROME_PATH) {
  const candidates = [process.env["ProgramFiles(x86)"], process.env.ProgramFiles].filter(Boolean);
  process.env.CHROME_PATH = candidates.map(root => path.join(root, "Microsoft/Edge/Application/msedge.exe")).find(file => fs.existsSync(file));
}
if (!process.env.npm_execpath) throw new Error("Use npm run qa:lighthouse:mobile.");
const summary = [];
for (const route of routes) {
  const url = new URL(route, base);
  if (!route.startsWith("/") || url.origin !== base.origin) throw new Error("Paths must belong to the base URL.");
  for (let run = 1; run <= runs; run++) {
    const name = ((url.pathname + url.search).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home") + "-" + run;
    const target = path.join(output, name);
    console.log("Mobile Lighthouse: " + url.pathname + url.search + " (" + run + "/" + runs + ")");
    const result = spawnSync(process.execPath, [
      process.env.npm_execpath, "exec", "--yes", "--package=lighthouse@13.6.0", "--", "lighthouse", url.href,
      "--only-categories=performance", "--form-factor=mobile",
      "--chrome-flags=--headless=new --no-first-run --no-default-browser-check",
      "--output=html", "--output=json", "--output-path=" + target, "--quiet",
    ], { stdio: "inherit", env: process.env });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
    const report = JSON.parse(fs.readFileSync(target + ".report.json", "utf8"));
    if (report.runtimeError) throw new Error(report.runtimeError.message);
    await verifyBackend();
    summary.push({
      path: url.pathname + url.search, run, score: Math.round(report.categories.performance.score * 100),
      lcpMs: Math.round(report.audits["largest-contentful-paint"].numericValue),
      cls: report.audits["cumulative-layout-shift"].numericValue,
      tbtMs: Math.round(report.audits["total-blocking-time"].numericValue),
    });
    fs.writeFileSync(path.join(output, "summary.json"), JSON.stringify(summary, null, 2));
  }
}
console.table(summary);
console.log("Reports: " + output);

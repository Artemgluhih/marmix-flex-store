import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PREVIEW = "https://marmix-flex-redesign-v2-preview-obu4h3tr8.vercel.app";
const ROUTES = ["/", "/catalog", "/product/azur", "/cart", "/checkout",
  "/applications", "/about", "/delivery", "/contacts", "/admin/login"];
const OUTPUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.qa-local/t070/security-readonly.json");
const MAX_ASSET_BYTES = 20 * 1024 * 1024;
const MARKERS = {
  supabaseSecretCredential: /\bsb_secret_[A-Za-z0-9._-]{12,}/g,
  legacyServiceRoleClaim: /["']service_role["']/g,
  databaseConnectionString: /\bpostgres(?:ql)?:\/\/[^\s"'<>]+/g,
  privateKey: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  serverConfigSecretName: /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|DATABASE_URL|POSTGRES_PASSWORD|TELEGRAM_BOT_TOKEN)\b/g,
  privateOrderAdminField: /\b(?:items_snapshot|internal_note|idempotency_key|admin_users|order_requests)\b/g,
};
const STRONG_MARKERS = ["supabaseSecretCredential", "databaseConnectionString", "privateKey"];
const HTML_PRIVATE_MARKERS = ["items_snapshot", "internal_note", "order_requests"];

function previewOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/^marmix-flex-redesign-v2-preview-[a-z0-9-]+\.vercel\.app$/.test(url.hostname) ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash || url.port) {
    throw new Error("--url must be an exact HTTPS Marmix Preview origin without credentials, path, query or fragment.");
  }
  return url.origin;
}

function argumentsFor(argv) {
  if (argv.length === 1 && argv[0] === "--self-test") return { selfTest: true };
  if (argv.length === 1 && argv[0] === "--help") return { help: true };
  if (argv.length === 0) return { origin: previewOrigin(DEFAULT_PREVIEW) };
  if (argv.length === 2 && argv[0] === "--url") return { origin: previewOrigin(argv[1]) };
  throw new Error("Use --url <exact-preview-origin>, --self-test or --help.");
}

function isPublishedScript(value, origin) {
  try {
    const url = new URL(value);
    return url.origin === origin && url.pathname.startsWith("/_next/static/") && url.pathname.endsWith(".js");
  } catch { return false; }
}

function emptySignals() {
  return Object.fromEntries(Object.keys(MARKERS).map((key) => [key, 0]));
}

function countSignals(source) {
  return Object.fromEntries(Object.entries(MARKERS).map(([name, regex]) => [name, [...source.matchAll(regex)].length]));
}

function headerValue(value, kind) {
  if (value == null) return null;
  const allowed = kind === "cache"
    ? /^(?:public|private|no-store|no-cache|must-revalidate|immutable|(?:max-age|s-maxage)=\d+)$/
    : /^(?:noindex|nofollow|none|all|index|follow|noarchive|nosnippet)$/;
  return value.toLowerCase().split(",").map((token) => {
    const directive = token.trim();
    return allowed.test(directive) ? directive : "[other directive omitted]";
  }).join(", ");
}

function publicCache(value) {
  return /(?:^|[, ])(?:public|s-maxage\s*=)/i.test(value ?? "");
}

function privateCache(value) {
  return /(?:^|[, ])(?:no-store|private)(?:[, =]|$)/i.test(value ?? "");
}

function bundleStatus(bundle, routes) {
  if (STRONG_MARKERS.some((name) => bundle.signals[name] > 0)) return "FAIL";
  if (Object.entries(bundle.signals).some(([, count]) => count > 0)) return "UNVERIFIED";
  if (routes.some((route) => route.status !== 200) || !bundle.discovered ||
    bundle.fetched !== bundle.discovered || bundle.unavailable || bundle.failedRequests) return "UNVERIFIED";
  return "PASS";
}

function adminStatus(admin) {
  if (admin.privateMarkerCount > 0 || admin.responses.some((r) => publicCache(r.cacheControl))) return "FAIL";
  const protectedResponse = admin.responses[0];
  if (!protectedResponse || protectedResponse.status < 300 || protectedResponse.status >= 400 ||
    !privateCache(protectedResponse.cacheControl) || admin.finalStatus !== 200 ||
    admin.finalPath !== "/admin/login" || !/\bnoindex\b/.test(admin.robotsMeta ?? "")) return "UNVERIFIED";
  return "PASS";
}

function selfTest() {
  assert.equal(argumentsFor([]).origin, DEFAULT_PREVIEW);
  assert.equal(previewOrigin(DEFAULT_PREVIEW), DEFAULT_PREVIEW);
  for (const value of ["https://marmixflex.ru", DEFAULT_PREVIEW + "/admin", DEFAULT_PREVIEW + "/?token=private",
    "https://user:pass@marmix-flex-redesign-v2-preview-test.vercel.app/"]) {
    assert.throws(() => previewOrigin(value));
  }
  assert.equal(isPublishedScript(DEFAULT_PREVIEW + "/_next/static/chunks/a.js", DEFAULT_PREVIEW), true);
  assert.equal(isPublishedScript("https://other.example/_next/static/a.js", DEFAULT_PREVIEW), false);
  const signals = countSignals("sb_publishable_public-example items_snapshot sb_secret_FAKE_CREDENTIAL_123456");
  assert.equal(signals.supabaseSecretCredential, 1);
  assert.equal(signals.privateOrderAdminField, 1);
  assert.equal(countSignals("sb_publishable_public-example").supabaseSecretCredential, 0);
  assert.equal(publicCache("public, s-maxage=60"), true);
  assert.equal(privateCache("private, no-store"), true);
  assert.equal(headerValue("sensitive\nvalue", "cache"), "[other directive omitted]");
  assert.equal(headerValue(null, "cache"), null);
  assert.equal(headerValue("private, s-maxage=30, token=private-value", "cache"),
    "private, s-maxage=30, [other directive omitted]");
  const bundle = { discovered: 1, fetched: 1, unavailable: 0, failedRequests: 0, signals: emptySignals() };
  assert.equal(bundleStatus(bundle, [{ status: 200 }]), "PASS");
  assert.equal(bundleStatus({ ...bundle, unavailable: 1 }, [{ status: 200 }]), "UNVERIFIED");
  assert.equal(bundleStatus({ ...bundle, signals }, [{ status: 200 }]), "FAIL");
  const admin = { responses: [{ status: 307, cacheControl: "private, no-store" }, { status: 200, cacheControl: "private" }],
    finalStatus: 200, finalPath: "/admin/login", robotsMeta: "noindex, nofollow", privateMarkerCount: 0 };
  assert.equal(adminStatus(admin), "PASS");
  assert.equal(adminStatus({ ...admin, responses: [{ status: 307, cacheControl: "public, s-maxage=60" }] }), "FAIL");
  assert.equal(adminStatus({ ...admin, responses: [{ status: 307, cacheControl: null }] }), "UNVERIFIED");
  console.log("PASS: T070 runner input, marker, cache, privacy and status self-test");
}

async function collectRoutes(context, origin, scripts, bundle) {
  const routes = [];
  for (const route of ROUTES) {
    const page = await context.newPage();
    let status = null;
    page.on("response", (response) => {
      if (isPublishedScript(response.url(), origin)) scripts.add(response.url());
    });
    page.on("requestfailed", (request) => {
      if (isPublishedScript(request.url(), origin)) bundle.failedRequests++;
    });
    try {
      const response = await page.goto(origin + route, { waitUntil: "networkidle", timeout: 30000 });
      status = response?.status() ?? null;
    } catch { /* No URL, response body or network exception goes into the report. */ }
    routes.push({ route, status });
    await page.close();
  }
  return routes;
}

async function inspectBundles(context, scripts, bundle) {
  bundle.discovered = scripts.size;
  for (const url of scripts) {
    try {
      const response = await context.request.get(url, { failOnStatusCode: false, maxRedirects: 0, timeout: 30000 });
      const size = Number(response.headers()["content-length"]);
      if (response.status() !== 200 || !/\b(?:javascript|ecmascript)\b/i.test(response.headers()["content-type"] ?? "") ||
        (Number.isFinite(size) && size > MAX_ASSET_BYTES)) { bundle.unavailable++; continue; }
      const body = await response.body();
      if (body.length > MAX_ASSET_BYTES) { bundle.unavailable++; continue; }
      bundle.fetched++;
      for (const [name, count] of Object.entries(countSignals(body.toString("utf8")))) bundle.signals[name] += count;
    } catch { bundle.unavailable++; }
  }
}

async function inspectAnonymousAdmin(context, origin) {
  const admin = { status: "UNVERIFIED", responses: [], finalStatus: null, finalPath: null,
    robotsMeta: null, privateMarkerCount: null, limitation: "Anonymous response only; signed Admin headers are not tested." };
  const page = await context.newPage();
  try {
    const response = await page.goto(origin + "/admin/orders", { waitUntil: "domcontentloaded", timeout: 30000 });
    const chain = [];
    for (let request = response?.request(); request; request = request.redirectedFrom()) {
      const res = await request.response();
      if (!res) continue;
      const headers = await res.allHeaders();
      chain.push({ status: res.status(), cacheControl: headerValue(headers["cache-control"], "cache"),
        xRobotsTag: headerValue(headers["x-robots-tag"], "robots") });
    }
    admin.responses = chain.reverse();
    admin.finalStatus = response?.status() ?? null;
    admin.finalPath = new URL(page.url()).pathname;
    admin.robotsMeta = headerValue(await page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null), "robots");
    admin.privateMarkerCount = await page.evaluate((markers) => markers.filter((marker) =>
      document.documentElement.outerHTML.includes(marker)).length, HTML_PRIVATE_MARKERS);
    admin.status = adminStatus(admin);
  } catch { admin.reason = "Anonymous Admin navigation or HTTP capture failed."; }
  finally { await page.close(); }
  return admin;
}

async function run(origin) {
  const result = { preview: origin, checkedAt: new Date().toISOString(),
    scope: "Anonymous pages and scripts loaded by them only; no sign-in or mutation.",
    routes: [], bundle: { status: "UNVERIFIED", discovered: 0, fetched: 0, unavailable: 0,
      failedRequests: 0, signals: emptySignals(), limitation: "Only JS chunks loaded by listed anonymous pages are covered." },
    admin: { status: "UNVERIFIED", limitation: "Anonymous response only; signed Admin headers are not tested." } };
  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: false });
    try {
      const scripts = new Set();
      result.routes = await collectRoutes(context, origin, scripts, result.bundle);
      await inspectBundles(context, scripts, result.bundle);
      result.bundle.status = bundleStatus(result.bundle, result.routes);
      result.admin = await inspectAnonymousAdmin(context, origin);
    } finally { await context.close(); }
  } catch {
    result.reason = "Playwright/Chromium startup failed. Install test-only dependencies and Chromium, then retry.";
  } finally { await browser?.close(); }
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`Bundle: ${result.bundle.status}; Admin HTTP: ${result.admin.status}; discovered JS: ${result.bundle.discovered}; fetched: ${result.bundle.fetched}; unavailable: ${result.bundle.unavailable}`);
  console.log(`Local report: ${OUTPUT}`);
  process.exitCode = result.bundle.status === "FAIL" || result.admin.status === "FAIL" ? 1 :
    result.bundle.status === "UNVERIFIED" || result.admin.status === "UNVERIFIED" ? 2 : 0;
}

try {
  const options = argumentsFor(process.argv.slice(2));
  if (options.selfTest) selfTest();
  else if (options.help) console.log("node scripts/t070-readonly-qa.mjs [--url https://marmix-flex-redesign-v2-preview-<id>.vercel.app] | --self-test");
  else await run(options.origin);
} catch (error) {
  if (process.argv.includes("--self-test")) throw error;
  console.error("Invalid input. Run with --help for the exact Preview URL format.");
  process.exitCode = 2;
}

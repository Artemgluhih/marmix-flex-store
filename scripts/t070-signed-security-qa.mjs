#!/usr/bin/env node
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PREVIEW, assertReview, classifyRevocation, classifyRowDenial, classifyStorageDenial,
  csrfRequestFromRenderedForm, parseArgs, parseJwtClaims, privateCache,
  safeResult, tokenIsLive, validateAuthFixture, validateFixtures,
} from "./t070-signed-qa-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, ".qa-local", "t070", "security-signed.json");
const FIXTURES = path.join(ROOT, ".qa-local", "t070", "approved-fixtures.json");
const AUTH_FIXTURE = path.join(ROOT, ".qa-local", "t070", "approved-auth.json");
const WEBP = Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", "base64");
const ORIGIN_MODES = ["wrong", "missing"];

function gitValue(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function localReview(sha, mode = "dry-run") {
  const originRemote = gitValue("remote", "get-url", "origin");
  if (originRemote !== "https://github.com/Artemgluhih/marmix-flex-store.git") {
    throw new Error("Unexpected repository remote");
  }
  assertReview({ branch: gitValue("branch", "--show-current"), head: gitValue("rev-parse", "HEAD"),
    expectedHead: sha, origin: PREVIEW.origin, deploymentSha: PREVIEW.deploymentSha,
    projectRef: PREVIEW.projectRef });
  const remoteLine = execFileSync("git",
    ["ls-remote", originRemote, "refs/heads/t070-preview-review"], {
      cwd: ROOT, encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "ignore"],
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    }).trim();
  if (remoteLine !== `${sha}\trefs/heads/t070-preview-review`) throw new Error("Remote review HEAD mismatch");
  if (mode !== "dry-run" && gitValue("status", "--porcelain")) throw new Error("Runner checkout is not clean");
}

function reportShell(mode, sha) {
  return { schema: "T070_SIGNED_QA_V1", mode, reviewSha: sha, deploymentSha: PREVIEW.deploymentSha,
    preview: PREVIEW.origin, scope: "Preview only; no REAL data or Production operations",
    results: [], liveSignedTestsExecuted: false, newFixturesCreatedByRunner: 0 };
}

async function saveReport(report) {
  const allowedTop = ["schema", "mode", "reviewSha", "deploymentSha", "preview", "scope",
    "results", "liveSignedTestsExecuted", "newFixturesCreatedByRunner"];
  if (Object.keys(report).some((key) => !allowedTop.includes(key)) ||
    report.results.some((entry) => Object.keys(entry).some((key) =>
      !["name", "status", "reason", "httpStatus", "affectedRows", "affectedObjects", "responsesScanned", "unchanged",
        "cacheControl", "xRobotsTag", "robotsMeta", "markerAbsent", "tokenLive"].includes(key)))) {
    throw new Error("Unsafe report schema");
  }
  await mkdir(path.dirname(REPORT), { recursive: true, mode: 0o700 });
  await writeFile(REPORT, JSON.stringify(report, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
}

function exactUrl(base, relative) {
  const url = new URL(relative, base);
  if (url.origin !== base || url.username || url.password || url.hash) throw new Error("Target origin mismatch");
  return url.href;
}

function timeout(ms = 15000) { return AbortSignal.timeout(ms); }

async function noRedirect(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: "manual", cache: "no-store", signal: timeout() });
  if (response.status >= 300 && response.status < 400) throw new Error("Unexpected redirect");
  return response;
}

function publicKeyFromAssets(assetTexts) {
  const keys = new Set();
  let projectFound = false;
  for (const source of assetTexts) {
    projectFound ||= source.includes(PREVIEW.projectRef);
    for (const match of source.matchAll(/\bsb_publishable_[A-Za-z0-9_-]{12,}/g)) keys.add(match[0]);
  }
  if (keys.size > 1) throw new Error("Ambiguous public Preview key");
  if (!projectFound || !keys.size) return null;
  return [...keys][0];
}

async function discoverPublicConfig(context) {
  const page = await context.newPage();
  const js = new Set();
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === PREVIEW.origin && url.pathname.startsWith("/_next/static/") && url.pathname.endsWith(".js")) {
      js.add(url.href);
    }
  });
  try {
    const response = await page.goto(PREVIEW.origin + "/admin/login", { waitUntil: "networkidle", timeout: 30000 });
    if (response?.status() !== 200 || !js.size) throw new Error("Preview login assets unavailable");
    const sources = [];
    for (const url of js) {
      const asset = await noRedirect(url);
      if (asset.status !== 200 || !/javascript|ecmascript/i.test(asset.headers.get("content-type") ?? "")) {
        throw new Error("Preview JavaScript asset unavailable");
      }
      const bytes = await asset.arrayBuffer();
      if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("Oversize Preview asset");
      sources.push(Buffer.from(bytes).toString("utf8"));
    }
    return publicKeyFromAssets(sources);
  } finally { await page.close(); }
}

function signinHtml(nonce, key, email = "") {
  const origin = JSON.stringify(PREVIEW.supabaseOrigin);
  const publicKey = JSON.stringify(key ?? "");
  if (email && !/^t070-[a-z0-9-]{6,64}@example\.invalid$/.test(email)) throw new Error("Unsafe temporary email");
  return `<!doctype html><html lang="ru"><meta charset="utf-8"><title>T070 Preview QA</title>
<body><h1>Временный тестовый вход T070</h1>
<p>Введите только одноразовую TEST_ONLY учётную запись Supabase Preview. Никогда не вводите основной пароль администратора.</p>
<p id="state" role="status">Проверка соединения…</p>
<form id="login" autocomplete="off"><label>Публичный publishable key Preview (если не найден автоматически)
<input name="publishable" type="text" autocomplete="off" value="${key ?? ""}"></label>
<label>Email тестовой записи <input name="email" type="email" autocomplete="off" value="${email}" ${email ? "readonly" : "disabled"} required></label>
<label>Временный пароль <input name="password" type="password" autocomplete="off" required></label>
<button id="submit" disabled type="submit">Проверить signed session</button></form>
<script nonce="${nonce}">
(() => {
  const origin = ${origin}, discoveredKey = ${publicKey};
  const state = document.getElementById("state");
  const form = document.getElementById("login");
  const submit = document.getElementById("submit");
  window.__t070Cors = false;
  fetch(origin + "/auth/v1/health", { headers: { "x-client-info": "t070-cors-preflight" },
    credentials: "omit", cache: "no-store", redirect: "error" })
    .then((r) => { if (r.type === "opaque" || r.status === 0) throw Error(); window.__t070Cors = true;
      submit.disabled = false; state.textContent = "Preview Auth доступен. Вход только для временной записи."; })
    .catch(() => { state.textContent = "CORS/Preview Auth не подтверждён. Ввод заблокирован."; });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!window.__t070Cors || submit.disabled) return;
    submit.disabled = true;
    let key = form.elements.publishable.value.trim();
    if (!/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(key) || (discoveredKey && key !== discoveredKey)) {
      state.textContent = "Публичный ключ Preview не подтверждён."; submit.disabled = false; return;
    }
    let email = form.elements.email.value;
    let password = form.elements.password.value;
    form.elements.password.value = "";
    form.elements.email.value = "";
    form.elements.publishable.value = "";
    try {
      const response = await fetch(origin + "/auth/v1/token?grant_type=password", {
        method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), credentials: "omit", cache: "no-store", redirect: "error",
      });
      password = ""; email = "";
      if (!response.ok) throw Error();
      const data = await response.json();
      const token = data.access_token;
      const userId = data.user?.id;
      data.access_token = undefined; data.refresh_token = undefined;
      if (typeof token !== "string" || typeof userId !== "string") throw Error();
      state.textContent = "Signed session получена. Окно будет закрыто.";
      await window.__t070Deliver({ token, userId, key });
    } catch {
      password = ""; email = ""; key = "";
      state.textContent = "Вход не подтверждён. Проверьте временную запись.";
      submit.disabled = false;
    }
  });
})();
</script></body></html>`;
}

async function withLocalSignin(key, callback, email = "") {
  const nonce = randomBytes(24).toString("base64");
  let port;
  const server = createServer((req, res) => {
    const local = req.socket.remoteAddress === "127.0.0.1" || req.socket.remoteAddress === "::ffff:127.0.0.1";
    const allowed = local && req.method === "GET" && req.url === "/signin" && req.headers.host === `127.0.0.1:${port}` &&
      !req.headers.origin && !req.headers["content-length"];
    if (!allowed) { res.writeHead(403, { "Cache-Control": "no-store" }); res.end(); return; }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; connect-src ${PREVIEW.supabaseOrigin}; form-action 'none'; base-uri 'none'; frame-ancestors 'none'` });
    res.end(signinHtml(nonce, key, email));
  });
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string" || address.address !== "127.0.0.1") {
    server.close(); throw new Error("Local listener not isolated");
  }
  port = address.port;
  try { return await callback(`http://127.0.0.1:${port}/signin`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

async function localPage(context, key, { interactive, email = "" }) {
  return withLocalSignin(key, async (localUrl) => {
    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const url = route.request().url();
      const safeLocal = url === localUrl && route.request().method() === "GET";
      const safeAuth = url === PREVIEW.supabaseOrigin + "/auth/v1/health" ||
        (interactive && url === PREVIEW.supabaseOrigin + "/auth/v1/token?grant_type=password");
      if (safeLocal || safeAuth) route.continue(); else route.abort();
    });
    try {
      let delivered;
      let deliver;
      if (interactive) {
        delivered = new Promise((resolve) => { deliver = resolve; });
        await page.exposeFunction("__t070Deliver", ({ token, userId, key: submittedKey }) => {
          deliver({ token, userId, key: submittedKey });
        });
      }
      await page.goto(localUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForFunction(() => window.__t070Cors === true, null, { timeout: 15000 });
      if (!interactive) return true;
      console.log("Открыто локальное окно для временной TEST_ONLY записи. Основной Admin пароль не вводите.");
      return await Promise.race([delivered, new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Local sign-in timed out")), 180000))]);
    } finally { await page.close(); }
  }, email);
}

async function httpPreflight() {
  const preview = await noRedirect(PREVIEW.origin + "/admin/login");
  if (preview.status !== 200) throw new Error("Pinned Preview unavailable");
  return withLocalSignin(null, async (localUrl) => {
    const local = await noRedirect(localUrl);
    const csp = local.headers.get("content-security-policy") ?? "";
    if (local.status !== 200 || !csp.includes("default-src 'none'") ||
      !csp.includes(`connect-src ${PREVIEW.supabaseOrigin}`)) throw new Error("Local CSP mismatch");
    const localOrigin = new URL(localUrl).origin;
    const response = await noRedirect(PREVIEW.supabaseOrigin + "/auth/v1/health", {
      method: "OPTIONS", headers: { Origin: localOrigin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "x-client-info" },
    });
    const allowed = response.headers.get("access-control-allow-origin");
    const methods = response.headers.get("access-control-allow-methods") ?? "";
    if (![200, 204].includes(response.status) || !["*", localOrigin].includes(allowed) ||
      !/\bGET\b/i.test(methods)) throw new Error("Preview Auth CORS preflight mismatch");
    return true;
  });
}

function authHeaders(key, token) {
  return { apikey: key, Authorization: `Bearer ${token}`, Accept: "application/json" };
}

async function signedRequest(key, token, route, options = {}) {
  const url = exactUrl(PREVIEW.supabaseOrigin, route);
  if (!url.startsWith(PREVIEW.supabaseOrigin + "/auth/v1/user") &&
    !url.startsWith(PREVIEW.supabaseOrigin + "/rest/v1/") &&
    !url.startsWith(PREVIEW.supabaseOrigin + "/storage/v1/object/")) throw new Error("Route not allowlisted");
  return noRedirect(url, { ...options, headers: { ...authHeaders(key, token), ...options.headers } });
}

async function authUser(key, token, expectedUserId) {
  const response = await signedRequest(key, token, "/auth/v1/user");
  if (response.status !== 200) return { status: response.status, valid: false };
  const body = await response.json();
  return { status: response.status, valid: body?.id === expectedUserId };
}

async function selectExact(key, token, table, id, columns) {
  if (!["products", "order_requests"].includes(table) ||
    !/^[0-9a-f-]{36}$/i.test(id) || !/^[a-z_,]+$/.test(columns)) throw new Error("Unsafe SELECT");
  const response = await signedRequest(key, token,
    `/rest/v1/${table}?id=eq.${id}&select=${columns}`, { headers: { Prefer: "count=exact" } });
  if (response.status !== 200) return { status: response.status, rows: null };
  const rows = await response.json();
  return { status: response.status, rows: Array.isArray(rows) ? rows : null };
}

async function ownMembership(key, token, userId) {
  const response = await signedRequest(key, token,
    `/rest/v1/admin_users?user_id=eq.${userId}&select=user_id,is_active`);
  if (response.status !== 200) return null;
  const rows = await response.json();
  return Array.isArray(rows) ? rows : null;
}

async function updateFixture(key, token, product) {
  const response = await signedRequest(key, token,
    `/rest/v1/products?id=eq.${product.id}&catalog_kind=eq.TEST_ONLY&is_published=eq.false`, {
      method: "PATCH", headers: { Prefer: "return=representation,count=exact", "Content-Type": "application/json" },
      body: JSON.stringify({ description: "T070 denied signed probe" }),
    });
  let rows = 0;
  if (response.status >= 200 && response.status < 300) {
    const body = await response.text();
    if (body) { const result = JSON.parse(body); rows = Array.isArray(result) ? result.length : 999; }
  }
  return { status: response.status, affectedRows: rows };
}

async function objectHash(pathValue) {
  const url = exactUrl(PREVIEW.supabaseOrigin,
    `/storage/v1/object/public/${PREVIEW.bucket}/${pathValue}`);
  const response = await noRedirect(url);
  if (response.status === 404) return null;
  if (response.status !== 200) throw new Error("Storage object verification unavailable");
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > 2 * 1024 * 1024) throw new Error("Oversize synthetic object");
  return createHash("sha256").update(body).digest("hex");
}

async function storageDeniedProbes(key, token, image) {
  const newPath = `products/${image.productId}/${randomUUID()}.webp`;
  if (await objectHash(newPath) !== null) throw new Error("Upload path collision");
  console.log("Exact synthetic upload probe path for private Owner verification:", newPath);
  let upload;
  try {
    upload = await signedRequest(key, token,
      `/storage/v1/object/${PREVIEW.bucket}/${newPath}`, {
        method: "POST", headers: { "Content-Type": "image/webp", "x-upsert": "false" }, body: WEBP,
      });
  } catch {
    console.error("Unknown upload outcome; exact TEST_ONLY recovery path:", newPath);
    throw new Error("Upload outcome unknown; independent exact-path inspection required, no retry");
  }
  const newHash = await objectHash(newPath);
  if (newHash !== null) {
    // The path is a non-secret, isolated TEST_ONLY recovery identifier.
    console.error("Unexpected TEST_ONLY Storage object; exact recovery path:", newPath);
    const failure = new Error("Denied upload created an object; stop before any other mutation");
    failure.securityViolation = true;
    throw failure;
  }
  if (![401, 403].includes(upload.status)) {
    throw new Error("Denied upload response ambiguous; stop before delete");
  }
  await ask("Через trusted Preview SELECT проверьте отсутствие только нового exact upload path. Введите ABSENT:", "ABSENT");
  const before = await objectHash(image.path);
  if (before !== image.sha256) throw new Error("Existing Storage fixture mismatch");
  let deletion;
  try {
    deletion = await signedRequest(key, token, `/storage/v1/object/${PREVIEW.bucket}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [image.path] }),
    });
  } catch {
    throw new Error("Delete outcome unknown; independent exact-path inspection required, no retry");
  }
  const after = await objectHash(image.path);
  return { uploadStatus: upload.status, uploadPath: newPath, newHash,
    deleteStatus: deletion.status, before, after };
}

async function ask(prompt, expected) {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  try {
    const answer = await rl.question(prompt + "\n> ");
    if (expected && answer.trim() !== expected) throw new Error("Owner checkpoint not confirmed");
    return answer.trim();
  } finally { rl.close(); }
}

async function independentDigest(expected) {
  const entered = await ask("Введите только текущий MD5/SHA digest TEST_ONLY row из независимого Preview SELECT (не SQL result body):");
  if (entered !== expected) return false;
  return true;
}

async function storageVerdicts(storage, image) {
  const uploadAbsent = storage.newHash === null;
  const metadataUnchanged = await independentDigest(image.metadataDigest);
  return {
    upload: uploadAbsent && [401, 403].includes(storage.uploadStatus) ?
      { status: "PASS", reason: null } :
      { status: uploadAbsent ? "UNVERIFIED" : "FAIL", reason: "unexpected_response" },
    deletion: classifyStorageDenial({
      targetPresentBefore: true, targetPresentAfter: storage.after !== null,
      hashBefore: storage.before, hashAfter: storage.after,
      affectedObjects: storage.after === null ? 1 : 0, status: storage.deleteStatus,
      independentMetadataUnchanged: metadataUnchanged,
    }),
  };
}

async function anonymousMarkerCheck(context, marker, key) {
  let absent = true;
  let scanned = 0;
  let unavailable = 0;
  let blockedUnsafe = 0;
  const anonContext = await context.browser().newContext({ serviceWorkers: "block", acceptDownloads: false });
  await restrictContext(anonContext, (kind) => { if (kind === "unsafe_external") blockedUnsafe++; });
  const page = await anonContext.newPage();
  const pending = [];
  page.on("response", (response) => {
    pending.push((async () => {
      const url = new URL(response.url());
      if (url.origin !== PREVIEW.origin) return;
      const headers = response.headers();
      if (!/html|json|javascript|x-component|text\/plain/i.test(headers["content-type"] ?? "")) return;
      if (Number(headers["content-length"]) > 2 * 1024 * 1024) { unavailable++; return; }
      try {
        const body = await response.body();
        if (body.length > 2 * 1024 * 1024) { unavailable++; return; }
        scanned++;
        if (body.includes(Buffer.from(marker))) absent = false;
      } catch { unavailable++; }
    })());
  });
  try {
    for (const route of ["/", "/catalog", "/admin/orders"]) {
      const response = await page.goto(PREVIEW.origin + route, { waitUntil: "networkidle", timeout: 30000 });
      if (!response || response.status() >= 500) throw new Error("Anonymous route unavailable");
    }
    await Promise.all(pending);
  } finally {
    await page.close();
    await anonContext.close();
  }
  const response = await noRedirect(exactUrl(PREVIEW.supabaseOrigin,
    "/rest/v1/order_requests?select=id,items_snapshot,internal_note"), {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (![200, 401, 403].includes(response.status)) throw new Error("Anonymous PostgREST response not classified");
  absent &&= !(await response.text()).includes(marker);
  return { absent, scanned, complete: scanned > 0 && unavailable === 0 && blockedUnsafe === 0 };
}

function requestBoundary(request) {
  let url;
  try { url = new URL(request.url()); }
  catch { return "unsafe_external"; }
  if (url.username || url.password) return "unsafe_external";
  if ([PREVIEW.origin, PREVIEW.supabaseOrigin].includes(url.origin)) return "allowed";
  // The deployed Preview bundle injects this optional Vercel feedback script.
  // Keep aborting it: this classification never grants a new network origin.
  if (url.href === "https://vercel.live/_next-live/feedback/feedback.js" &&
    request.method() === "GET" && request.resourceType() === "script") return "optional_feedback";
  if (url.protocol === "http:" && url.hostname === "127.0.0.1" &&
    url.pathname === "/signin" && !url.search && !url.hash) return "local_intercept";
  return "unsafe_external";
}

async function restrictContext(context, onBlocked = () => {}) {
  await context.route("**/*", (route) => {
    const kind = requestBoundary(route.request());
    if (kind === "allowed") route.continue();
    else { onBlocked(kind); route.abort(); }
  });
}

async function adminBrowser(context, productId) {
  const page = await context.newPage();
  await page.goto(PREVIEW.origin + "/admin/login", { waitUntil: "domcontentloaded" });
  console.log("При необходимости войдите в Preview Admin только под временной active Admin записью.");
  await page.waitForURL((url) => url.origin === PREVIEW.origin && url.pathname.startsWith("/admin/") &&
    url.pathname !== "/admin/login", { timeout: 180000 });
  const responses = [];
  for (const route of ["/admin/orders", `/admin/products/${productId}`]) {
    const response = await page.goto(PREVIEW.origin + route, { waitUntil: "domcontentloaded" });
    const headers = await response.allHeaders();
    const robots = await page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null);
    const protectedHeaders = response.status() === 200 && privateCache(headers["cache-control"]) &&
      (!headers["x-robots-tag"] || /\bnoindex\b/i.test(headers["x-robots-tag"])) &&
      /\bnoindex\b/i.test(robots ?? "");
    responses.push(safeResult(route === "/admin/orders" ? "admin_orders_headers" : "admin_product_headers",
      { status: protectedHeaders ? "PASS" : "FAIL",
        reason: protectedHeaders ? null : "private_cache" },
      { httpStatus: response.status(), cacheControl: headers["cache-control"] ?? null,
        xRobotsTag: headers["x-robots-tag"] ?? null, robotsMeta: robots }));
  }
  return { page, responses };
}

async function csrfProbe(page, product, report) {
  const rendered = await page.locator('form:has(textarea[name="description"])').evaluate((form) => ({
    fields: Array.from(new FormData(form).entries()).map(([name, value]) => [name, String(value)]),
    actionUrl: location.href, productId: location.pathname.split("/").at(-1),
  })).catch(() => null);
  if (!rendered || rendered.productId !== product.id) {
    report.results.push(safeResult("csrf", { status: "UNVERIFIED", reason: "action_not_captured" })); return;
  }
  const description = rendered.fields.find(([name]) => name === "description");
  if (!description) {
    report.results.push(safeResult("csrf", { status: "UNVERIFIED", reason: "action_not_captured" })); return;
  }
  description[1] = `T070 CSRF negative probe ${randomUUID()}`;
  for (const mode of ORIGIN_MODES) {
    let constructed;
    try { constructed = csrfRequestFromRenderedForm(rendered, mode); }
    catch {
      report.results.push(safeResult("csrf_" + mode, { status: "UNVERIFIED", reason: "action_not_captured" }));
      return;
    }
    let response;
    try {
      response = await page.context().request.post(constructed.url, {
        multipart: constructed.multipart, headers: constructed.headers,
        maxRedirects: 0, failOnStatusCode: false, timeout: 15000,
      });
    } catch {
      report.results.push(safeResult("csrf_" + mode, { status: "UNVERIFIED", reason: "timeout_unknown" }));
      await independentDigest(product.baselineDigest);
      throw new Error("CSRF action outcome unknown; no retry");
    }
    const unchanged = await independentDigest(product.baselineDigest);
    const rejected = [400, 401, 403].includes(response.status()) ||
      ([303, 307, 308].includes(response.status()) &&
        new URL(response.headers()["location"] ?? "/invalid", PREVIEW.origin).pathname === "/admin/login");
    const verdict = unchanged ? { status: rejected ? "PASS" : "UNVERIFIED",
      reason: rejected ? null : "unexpected_response" } :
      { status: "FAIL", reason: "unexpected_response" };
    report.results.push(safeResult("csrf_" + mode, verdict, { httpStatus: response.status(), unchanged }));
    if (verdict.status !== "PASS") throw new Error("CSRF denial not confirmed; no next probe");
  }
}

async function runPhases(key, token, userId, fixtures, context, report, assertNetwork) {
  const claims = parseJwtClaims(token);
  if (claims.sub !== fixtures.userId || userId !== fixtures.userId || !tokenIsLive(claims)) {
    throw new Error("Temporary Auth identity/expiry mismatch");
  }
  const firstAuth = await authUser(key, token, userId);
  if (!firstAuth.valid) throw new Error("Signed Auth user not confirmed");
  report.liveSignedTestsExecuted = true;
  const initial = await ownMembership(key, token, userId);
  if (!initial || initial.length !== 0) throw new Error("Non-admin membership baseline mismatch");
  const product = await selectExact(key, token, "products", fixtures.product.id, "id,catalog_kind");
  const order = await selectExact(key, token, "order_requests", fixtures.order.id, "id");
  const deniedSelect = (result) => [401, 403].includes(result.status) ||
    (result.status === 200 && result.rows?.length === 0);
  const absent = deniedSelect(product) && deniedSelect(order);
  report.results.push(safeResult("nonadmin_select", { status: absent ? "PASS" : "FAIL",
    reason: absent ? null : "unexpected_response" }, { httpStatus: product.status, affectedRows: product.rows?.length ?? 0 }));
  if (!absent) throw new Error("Private row exposed to non-admin");
  await ask("Owner: проверьте в trusted Preview channel exact TEST_ONLY row, WebP и digest. Для одной отрицательной PATCH/Storage попытки введите APPROVED:", "APPROVED");
  if (!tokenIsLive(claims)) throw new Error("Frozen JWT expired before probe");
  let change;
  try { change = await updateFixture(key, token, fixtures.product); }
  catch {
    report.results.push(safeResult("nonadmin_update", { status: "UNVERIFIED", reason: "timeout_unknown" }));
    await independentDigest(fixtures.product.baselineDigest);
    throw new Error("Non-admin UPDATE outcome unknown; no retry");
  }
  const unchanged = await independentDigest(fixtures.product.baselineDigest);
  const updateVerdict = classifyRowDenial({ targetPresentBefore: true, status: change.status,
    affectedRows: change.affectedRows, digestBefore: fixtures.product.baselineDigest,
    digestAfter: unchanged ? fixtures.product.baselineDigest : "mismatch" });
  report.results.push(safeResult("nonadmin_update", updateVerdict,
    { httpStatus: change.status, affectedRows: change.affectedRows, unchanged }));
  if (updateVerdict.status !== "PASS") throw new Error("Signed UPDATE denial not confirmed");
  let storage;
  try { storage = await storageDeniedProbes(key, token, { ...fixtures.image, productId: fixtures.product.id }); }
  catch (error) {
    report.results.push(safeResult("nonadmin_storage", { status: error.securityViolation ? "FAIL" : "UNVERIFIED",
      reason: error.securityViolation ? "unexpected_response" : "timeout_unknown" }));
    throw new Error("Storage outcome unknown or unsafe; no retry");
  }
  const storageVerdict = await storageVerdicts(storage, fixtures.image);
  report.results.push(safeResult("nonadmin_storage_upload", storageVerdict.upload,
    { httpStatus: storage.uploadStatus, affectedObjects: storageVerdict.upload.status === "FAIL" ? 1 : 0 }));
  report.results.push(safeResult("nonadmin_storage_delete", storageVerdict.deletion,
    { httpStatus: storage.deleteStatus, unchanged: storageVerdict.deletion.status === "PASS" }));
  if (storageVerdict.upload.status !== "PASS" || storageVerdict.deletion.status !== "PASS") throw new Error("Storage denial not confirmed");

  await ask("Owner: добавьте active membership только временному UUID через trusted Preview channel. Затем введите ACTIVE:", "ACTIVE");
  if (!tokenIsLive(claims)) throw new Error("Frozen JWT expired before active phase");
  const active = await ownMembership(key, token, userId);
  const visible = await selectExact(key, token, "products", fixtures.product.id, "id,catalog_kind,is_published");
  const visibleOrder = await selectExact(key, token, "order_requests", fixtures.order.id, "id");
  const activePass = active?.length === 1 && active[0].is_active === true &&
    visible.rows?.length === 1 && visible.rows[0].catalog_kind === "TEST_ONLY" &&
    visible.rows[0].is_published === false && visibleOrder.rows?.length === 1;
  report.results.push(safeResult("active_admin_select", { status: activePass ? "PASS" : "FAIL",
    reason: activePass ? null : "unexpected_response" }, { httpStatus: visible.status, affectedRows: visible.rows?.length ?? 0 }));
  if (!activePass) throw new Error("Active Admin signed visibility not confirmed");
  const { page, responses } = await adminBrowser(context, fixtures.product.id);
  assertNetwork();
  report.results.push(...responses);
  if (responses.some((entry) => entry.status === "FAIL")) throw new Error("Authenticated Admin privacy headers unsafe");
  const marker = await anonymousMarkerCheck(context, fixtures.order.marker, key);
  report.results.push(safeResult("anonymous_synthetic_marker",
    { status: !marker.absent ? "FAIL" : marker.complete ? "PASS" : "UNVERIFIED",
      reason: !marker.absent ? "anonymous_marker" : marker.complete ? null : "network_failure" },
    { markerAbsent: marker.absent, responsesScanned: marker.scanned }));
  if (!marker.absent) throw new Error("Synthetic private marker exposed");
  await csrfProbe(page, fixtures.product, report);

  await ask("Owner: деактивируйте только временную membership без logout. Затем введите REVOKED:", "REVOKED");
  const live = tokenIsLive(claims);
  const afterAuth = live ? await authUser(key, token, userId) : { status: 401, valid: false };
  const revokedMembership = live ? await ownMembership(key, token, userId) : null;
  const hidden = live ? await selectExact(key, token, "products", fixtures.product.id, "id") : { rows: null };
  const denied = revokedMembership?.length === 1 && revokedMembership[0].is_active === false &&
    deniedSelect(hidden);
  const beforeWrite = classifyRevocation({ sameToken: true, authStatus: afterAuth.status,
    live, denied, unchanged: null });
  if (!live || !afterAuth.valid || !denied) {
    report.results.push(safeResult("revoked_same_token", beforeWrite, { tokenLive: live }));
    return;
  }
  await ask("Owner: проверьте baseline и разрешённый denied probe для revoked JWT. Введите APPROVED:", "APPROVED");
  let revokedChange;
  try { revokedChange = await updateFixture(key, token, fixtures.product); }
  catch {
    report.results.push(safeResult("revoked_update", { status: "UNVERIFIED", reason: "timeout_unknown" }));
    await independentDigest(fixtures.product.baselineDigest);
    throw new Error("Revoked UPDATE outcome unknown; no retry");
  }
  const revokedUnchanged = await independentDigest(fixtures.product.baselineDigest);
  let revokedStorage;
  try { revokedStorage = await storageDeniedProbes(key, token, { ...fixtures.image, productId: fixtures.product.id }); }
  catch (error) {
    report.results.push(safeResult("revoked_storage", { status: error.securityViolation ? "FAIL" : "UNVERIFIED",
      reason: error.securityViolation ? "unexpected_response" : "timeout_unknown" }));
    throw new Error("Revoked Storage outcome unknown or unsafe; no retry");
  }
  const revokedStorageVerdict = await storageVerdicts(revokedStorage, fixtures.image);
  const verdict = classifyRevocation({ sameToken: true, authStatus: afterAuth.status,
    live: tokenIsLive(claims), denied: denied &&
      classifyRowDenial({ targetPresentBefore: true, status: revokedChange.status,
        affectedRows: revokedChange.affectedRows, digestBefore: fixtures.product.baselineDigest,
        digestAfter: revokedUnchanged ? fixtures.product.baselineDigest : "mismatch" }).status === "PASS" &&
      revokedStorageVerdict.upload.status === "PASS" && revokedStorageVerdict.deletion.status === "PASS",
    unchanged: revokedUnchanged });
  report.results.push(safeResult("revoked_same_token", verdict, { httpStatus: afterAuth.status,
    affectedRows: revokedChange.affectedRows, unchanged: revokedUnchanged, tokenLive: tokenIsLive(claims) }));
  if (verdict.status !== "PASS") throw new Error("Revoked signed denial not confirmed");
  const route = await page.goto(PREVIEW.origin + "/admin/orders", { waitUntil: "domcontentloaded" });
  const deniedRoute = new URL(page.url()).pathname === "/admin/login";
  report.results.push(safeResult("revoked_admin_route", { status: deniedRoute ? "PASS" : "FAIL",
    reason: deniedRoute ? null : "unexpected_response" }, { httpStatus: route?.status() ?? 0 }));
  await page.close();
}

async function runExpiry(key, token, userId, report) {
  const claims = parseJwtClaims(token);
  if (claims.sub !== userId || !tokenIsLive(claims)) throw new Error("Expiry baseline invalid");
  const waitMs = claims.exp * 1000 + 60000 - Date.now();
  if (waitMs > 2 * 60 * 60 * 1000 || waitMs < 0) throw new Error("Natural expiry window unavailable");
  console.log("Ожидание естественного истечения JWT. Не меняйте системные часы и Auth TTL.");
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const after = await authUser(key, token, userId);
  const db = await signedRequest(key, token,
    `/rest/v1/admin_users?user_id=eq.${userId}&select=user_id`);
  const expired = [401, 403].includes(after.status) && [401, 403].includes(db.status);
  report.results.push(safeResult("natural_expiry", { status: expired ? "PASS" : "UNVERIFIED",
    reason: expired ? null : "unexpected_response" }, { httpStatus: after.status, tokenLive: false }));
  report.results.push(safeResult("app_refresh", { status: "UNVERIFIED", reason: "not_executed" }));
}

async function run(options) {
  localReview(options.reviewSha, options.mode);
  const report = reportShell(options.mode, options.reviewSha);
  try {
    await httpPreflight();
    report.results.push(safeResult("preview_http_local_csp_cors",
      { status: "PASS", reason: null }));
  } catch {
    report.results.push(safeResult("preview_http_local_csp_cors",
      { status: "UNVERIFIED", reason: "network_failure" }));
    await saveReport(report);
    throw new Error("Preview HTTP/CSP/CORS preflight unavailable");
  }
  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: options.mode === "dry-run" });
  } catch {
    report.results.push(safeResult("chromium_startup", { status: "UNVERIFIED", reason: "browser_unavailable" }));
    await saveReport(report);
    throw new Error("Chromium unavailable");
  }
  let context;
  let blockedOptional = 0;
  let blockedLocal = 0;
  let blockedUnsafe = 0;
  try {
    context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: false });
    await restrictContext(context, (kind) => {
      if (kind === "optional_feedback") blockedOptional++;
      else if (kind === "local_intercept") { blockedLocal++; blockedUnsafe++; }
      else blockedUnsafe++;
    });
    const discoveredKey = await discoverPublicConfig(context);
    if (blockedUnsafe !== 0) throw new Error("Unexpected external browser request before credential entry");
    const cors = await localPage(context, discoveredKey, { interactive: false });
    if (blockedUnsafe !== 0) throw new Error("Unexpected external browser request before credential entry");
    report.results.push(safeResult("preview_config_and_cors", { status: cors ? "PASS" : "UNVERIFIED",
      reason: cors ? null : "network_failure" }));
    if (options.mode !== "dry-run") {
      const fixtures = options.mode === "execute" ?
        validateFixtures(JSON.parse(await readFile(FIXTURES, "utf8"))) :
        validateAuthFixture(JSON.parse(await readFile(AUTH_FIXTURE, "utf8")));
      await ask("Отдельное Owner approval на signed execution и exact fixtures получено? Введите OWNER_APPROVED:", "OWNER_APPROVED");
      const signed = await localPage(context, discoveredKey, { interactive: true, email: fixtures.userEmail });
      try {
        if (options.mode === "execute") await runPhases(signed.key, signed.token, signed.userId,
          fixtures, context, report, () => {
            if (blockedUnsafe !== 0) throw new Error("Unexpected external browser request");
          });
        else await runExpiry(signed.key, signed.token, signed.userId, report);
      } finally { signed.token = undefined; signed.key = undefined; }
    }
  } finally {
    report.results.push(safeResult("optional_feedback_blocked", { status: "PASS", reason: null },
      { affectedObjects: blockedOptional }));
    report.results.push(safeResult("localhost_interception",
      { status: blockedLocal === 0 ? "PASS" : "UNVERIFIED",
        reason: blockedLocal === 0 ? null : "network_failure" },
      { affectedObjects: blockedLocal }));
    report.results.push(safeResult("external_requests_blocked",
      { status: blockedUnsafe === 0 ? "PASS" : "UNVERIFIED",
        reason: blockedUnsafe === 0 ? null : "network_failure" },
      { affectedObjects: blockedUnsafe }));
    await context?.close();
    await browser.close();
    await saveReport(report);
  }
  console.log(`T070 ${options.mode}: ${report.results.map((entry) => entry.name + "=" + entry.status).join(", ")}`);
  console.log("Обезличенный локальный отчёт: .qa-local/t070/security-signed.json");
  if (report.results.some((entry) => entry.status !== "PASS")) process.exitCode = 2;
}

const usage = "node scripts/t070-signed-security-qa.mjs --self-test | --dry-run --review-sha <HEAD> | --execute --review-sha <HEAD> | --observe-expiry --review-sha <HEAD>";
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.mode === "help") console.log(usage);
    else if (options.mode === "self-test") {
      const result = spawnSync(process.execPath, ["--test", "tests/t070-signed-security-qa.test.mjs"],
        { cwd: ROOT, stdio: "inherit" });
      process.exitCode = result.status === 0 ? 0 : 2;
    } else await run(options);
  } catch {
    // Never print library exceptions: they can contain Authorization headers or private response bodies.
    console.error("T070 stopped safely. No PASS is inferred. Check the generic failure and the allowlisted local report if present.");
    process.exitCode = 2;
  }
}

export { signinHtml, withLocalSignin, publicKeyFromAssets, localReview, requestBoundary, restrictContext };

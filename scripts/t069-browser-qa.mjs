import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PREVIEW = "https://marmix-flex-redesign-v2-preview-g8zfqktct.vercel.app";
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const ROUTES = ["/", "/catalog", "/product/azur", "/cart", "/checkout",
  "/applications", "/about", "/delivery", "/contacts"];
const OUTPUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.qa-local/t069");
const ERROR_PATTERN = /hydrat|server.rendered.html|react.*error/i;

function previewOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") ||
    url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Use an HTTPS Vercel Preview origin without a path, query, or credentials.");
  }
  return url.origin;
}

function isMetrika(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "mc.yandex.ru" || host === "mc.yandex.com" ||
      host === "metrika.yandex.ru" || host === "metrika.yandex.com" ||
      host === "mc.webvisor.com" || host === "mc.webvisor.org";
  } catch { return false; }
}

function classifyHttp(status, mainDocument) {
  if (status < 400) return null;
  // All nine routes are expected 200; no 4xx/5xx is silently accepted.
  return mainDocument ? "unexpected_document_http" : "unexpected_resource_http";
}

function classifyRequestFailure(errorText) {
  // A canceled request during a browser navigation is not a server failure.
  return /net::ERR_ABORTED/i.test(errorText || "") ? "expected_navigation_abort" : "unexpected_request_failure";
}

function emptyRow(width, route, reason) {
  return { width, route, status: "UNVERIFIED", reason,
    documentStatus: null, overflowPx: null, h1Count: null, brokenImages: null,
    jsErrors: null, hydrationErrors: null, failedRequests: null,
    expectedAborts: null, unexpectedHttp: null, yandexRequests: null,
    focus: "UNVERIFIED" };
}

function resultStatus(row) {
  if (row.reason) return "UNVERIFIED";
  return row.documentStatus === 200 && row.overflowPx === 0 &&
    row.h1Count === 1 && row.brokenImages === 0 && row.jsErrors === 0 &&
    row.hydrationErrors === 0 && row.failedRequests === 0 &&
    row.unexpectedHttp === 0 && row.yandexRequests === 0 && row.focus === "PASS"
    ? "PASS" : "FAIL";
}

function render(rows, origin) {
  const header = [
    "# T069 — локальная браузерная проверка",
    "",
    `Preview: ${origin}`,
    `Выполнено: ${new Date().toISOString()}`,
    "",
    "Проверены только публичные маршруты. Формы не отправлялись. Отчёт не содержит URL запросов, содержимого ответов, PII или секретов.",
    "Все 9 маршрутов ожидают HTTP 200. Любой HTTP 4xx/5xx отмечается как unexpected; отмена запроса при навигации учитывается отдельно.",
    "",
    "| Ширина | Маршрут | Итог | HTTP | Overflow px | H1 | Изображения | JS | Hydration | Network fail | HTTP 4xx/5xx | Яндекс | Focus |",
    "| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const r of rows) {
    const value = (v) => v === null ? "—" : String(v);
    header.push(`| ${r.width} | \`${r.route}\` | ${r.status} | ${value(r.documentStatus)} | ${value(r.overflowPx)} | ${value(r.h1Count)} | ${value(r.brokenImages)} | ${value(r.jsErrors)} | ${value(r.hydrationErrors)} | ${value(r.failedRequests)} | ${value(r.unexpectedHttp)} | ${value(r.yandexRequests)} | ${r.focus} |`);
  }
  const reasons = [...new Set(rows.filter((r) => r.reason).map((r) => r.reason))];
  header.push("", `Итого: PASS ${rows.filter((r) => r.status === "PASS").length}, FAIL ${rows.filter((r) => r.status === "FAIL").length}, UNVERIFIED ${rows.filter((r) => r.status === "UNVERIFIED").length}.`);
  if (reasons.length) header.push("", "Непроверено: " + reasons.join("; "));
  header.push("", "Content Gate: BLOCKED. Legal sign-off: PENDING. Checkout submit: DISABLED. Owner verification: NOT YET PASS.", "");
  return header.join("\n");
}

async function save(rows, origin) {
  await mkdir(OUTPUT, { recursive: true });
  await Promise.all([
    writeFile(path.join(OUTPUT, "report.md"), render(rows, origin), "utf8"),
    writeFile(path.join(OUTPUT, "report.json"), JSON.stringify({ preview: origin, rows }, null, 2) + "\n", "utf8"),
  ]);
}

async function inspect(page, width, route, origin) {
  const row = emptyRow(width, route, null);
  let mainResponse = null;
  let mainRequest = null;
  const errors = { js: 0, hydration: 0, failed: 0, aborts: 0, http: 0, yandex: 0 };
  page.on("pageerror", (error) => {
    errors.js++;
    if (ERROR_PATTERN.test(error.message)) errors.hydration++;
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    errors.js++;
    if (ERROR_PATTERN.test(message.text())) errors.hydration++;
  });
  page.on("request", (request) => {
    if (isMetrika(request.url())) errors.yandex++;
  });
  page.on("requestfailed", (request) => {
    const kind = classifyRequestFailure(request.failure()?.errorText);
    if (kind === "expected_navigation_abort") errors.aborts++;
    else errors.failed++;
  });
  page.on("response", (response) => {
    if (classifyHttp(response.status(), response.request() === mainRequest)) errors.http++;
  });
  try {
    const target = origin + route;
    const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
    mainResponse = response;
    mainRequest = response?.request() ?? null;
    row.documentStatus = response?.status() ?? null;
    // Let client hydration and ordinary resources settle; do not submit forms or click commerce actions.
    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {
      row.reason = "networkidle timeout; result cannot be certified";
    });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((position) => window.scrollTo(0, position), y);
      await page.waitForTimeout(80);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const dom = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      h1Count: document.querySelectorAll("main h1").length,
      images: [...document.images].map((image) => ({
        complete: image.complete,
        loaded: image.naturalWidth > 0,
      })),
    }));
    if (dom.width !== width) row.reason = `viewport mismatch: expected ${width}, got ${dom.width}`;
    row.overflowPx = Math.max(0, dom.scrollWidth - dom.width);
    row.h1Count = dom.h1Count;
    row.brokenImages = dom.images.filter((image) => image.complete && !image.loaded).length;
    if (dom.images.some((image) => !image.complete)) row.reason = "some images did not finish loading";
    // Browser keyboard action only; no links or buttons are activated.
    await page.keyboard.press("Tab");
    row.focus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return "FAIL";
      const tag = el.tagName.toLowerCase();
      const actionable = ["a", "button", "input", "select", "textarea"].includes(tag) ||
        el.getAttribute("tabindex") !== null;
      return actionable && el.matches(":focus-visible") ? "PASS" : "FAIL";
    });
  } catch {
    row.reason = "navigation or browser operation failed; inspect locally without sharing private logs";
  }
  row.jsErrors = errors.js;
  row.hydrationErrors = errors.hydration;
  row.failedRequests = errors.failed;
  row.expectedAborts = errors.aborts;
  row.unexpectedHttp = errors.http;
  row.yandexRequests = errors.yandex;
  row.status = resultStatus(row);
  return row;
}

function selfTest() {
  assert.equal(WIDTHS.length * ROUTES.length, 54);
  assert.equal(new Set(WIDTHS).size, 6);
  assert.equal(new Set(ROUTES).size, 9);
  assert.equal(previewOrigin(PREVIEW), PREVIEW);
  assert.throws(() => previewOrigin("https://marmixflex.ru"));
  assert.throws(() => previewOrigin(PREVIEW + "/checkout?name=private"));
  assert.equal(isMetrika("https://mc.yandex.ru/metrika/tag.js"), true);
  assert.equal(isMetrika("https://mc.webvisor.org/watch/1"), true);
  assert.equal(isMetrika("https://example.com/mc.yandex.ru"), false);
  assert.equal(classifyHttp(404, true), "unexpected_document_http");
  assert.equal(classifyHttp(500, false), "unexpected_resource_http");
  assert.equal(classifyHttp(200, false), null);
  assert.equal(classifyRequestFailure("net::ERR_ABORTED"), "expected_navigation_abort");
  assert.equal(classifyRequestFailure("net::ERR_CONNECTION_RESET"), "unexpected_request_failure");
  assert.equal(resultStatus(emptyRow(390, "/", "blocked")), "UNVERIFIED");
  assert.ok(!render([emptyRow(390, "/", "blocked")], PREVIEW).includes("private"));
  console.log("PASS: T069 runner classification, Preview guard, privacy-safe report");
}

async function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const option = process.argv.indexOf("--url");
  const origin = previewOrigin(option < 0 ? PREVIEW : process.argv[option + 1] ?? "");
  const rows = [];
  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 }, deviceScaleFactor: 1,
        reducedMotion: "reduce", serviceWorkers: "block",
      });
      try {
        for (const route of ROUTES) {
          const page = await context.newPage();
          try {
            const row = await inspect(page, width, route, origin);
            rows.push(row);
            console.log(`${width} ${route}: ${row.status}`);
          } finally { await page.close(); }
        }
      } finally { await context.close(); }
    }
  } catch (error) {
    const reason = error?.code === "ERR_MODULE_NOT_FOUND"
      ? "Playwright is not installed; run the Windows install commands"
      : "Chromium/browser setup failed; inspect the terminal locally";
    for (const width of WIDTHS) for (const route of ROUTES) {
      if (!rows.some((r) => r.width === width && r.route === route)) rows.push(emptyRow(width, route, reason));
    }
    console.error(reason);
  } finally {
    await browser?.close();
    await save(rows, origin);
    console.log(`Report: ${path.join(OUTPUT, "report.md")}`);
  }
  process.exitCode = rows.some((r) => r.status === "FAIL") ? 1 :
    rows.some((r) => r.status === "UNVERIFIED") ? 2 : 0;
}

main();

import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import {
  PREVIEW, assertReview, classifyRevocation, classifyRowDenial, classifyStorageDenial,
  csrfRequestFromRenderedForm, exactOrigin, parseArgs, parseJwtClaims, privateCache,
  safeHeader, safeResult, tokenIsLive, validateAuthFixture, validateFixtures,
} from "../scripts/t070-signed-qa-core.mjs";
import { publicKeyFromAssets, requestBoundary, restrictContext, signinHtml, withLocalSignin } from "../scripts/t070-signed-security-qa.mjs";

const ID = "19bbe932-ee48-4306-b7f1-d615a5a64a34";
const USER = "01a6213d-85dc-4851-829c-9d2ee0f30af0";
const ORDER = "a8b701e4-7a1c-4f0c-8583-4195ed819278";
const IMAGE = "5fdf6a5a-a1ad-4fdd-ab12-c548fe5d73e3";
const PATH = `products/${ID}/1ae43f7a-867f-4d9e-9450-cdc8a087ffd9.webp`;
const manifest = {
  origin: PREVIEW.origin, deploymentSha: PREVIEW.deploymentSha, projectRef: PREVIEW.projectRef,
  approval: "OWNER_APPROVED_T070_SIGNED_EXECUTION", userId: USER,
  userEmail: "t070-synthetic-test@example.invalid",
  product: { id: ID, sku: "TEST_ONLY-T070-19BBE932", slug: "t070-qa-product-20261009",
    catalogKind: "TEST_ONLY", isPublished: false, baselineDigest: "a".repeat(32) },
  image: { id: IMAGE, path: PATH, sha256: "b".repeat(64), metadataDigest: "c".repeat(32) },
  order: { id: ORDER, marker: "T070_QA_SYNTHETIC_1234" },
};

test("exact Preview, project, branch and review SHA fail closed", () => {
  assert.equal(exactOrigin(PREVIEW.origin, PREVIEW.origin), PREVIEW.origin);
  for (const origin of ["https://marmixflex.ru", PREVIEW.origin + "/admin", PREVIEW.origin + "/?x=1",
    "https://user:pass@marmix-flex-redesign-v2-preview-efx5iy5ej.vercel.app/",
    "http://marmix-flex-redesign-v2-preview-efx5iy5ej.vercel.app"]) {
    assert.throws(() => exactOrigin(origin, PREVIEW.origin));
  }
  const base = { branch: PREVIEW.branch, head: "a".repeat(40), expectedHead: "a".repeat(40),
    origin: PREVIEW.origin, deploymentSha: PREVIEW.deploymentSha, projectRef: PREVIEW.projectRef };
  assert.equal(assertReview(base), true);
  for (const change of [{ branch: "main" }, { head: "b".repeat(40) },
    { deploymentSha: "c".repeat(40) }, { projectRef: "production-ref" }]) {
    assert.throws(() => assertReview({ ...base, ...change }));
  }
  assert.deepEqual(parseArgs(["--dry-run", "--review-sha", "a".repeat(40)]),
    { mode: "dry-run", reviewSha: "a".repeat(40) });
  assert.throws(() => parseArgs(["--execute"]));
  assert.throws(() => parseArgs(["--dry-run", "--url", "https://marmixflex.ru"]));
});

test("exact present TEST_ONLY fixture manifest and no arbitrary target", () => {
  assert.equal(validateFixtures(structuredClone(manifest)).product.id, ID);
  assert.equal(validateAuthFixture({ origin: PREVIEW.origin, deploymentSha: PREVIEW.deploymentSha,
    projectRef: PREVIEW.projectRef, approval: manifest.approval,
    userId: USER, userEmail: manifest.userEmail }).userId, USER);
  for (const change of [
    { product: { ...manifest.product, catalogKind: "REAL" } },
    { product: { ...manifest.product, isPublished: true } },
    { image: { ...manifest.image, path: `products/${USER}/${IMAGE}.webp` } },
    { approval: "missing" },
    { origin: "https://marmixflex.ru" },
  ]) assert.throws(() => validateFixtures({ ...manifest, ...change }));
});

test("signed RLS denial needs a present target, zero affected rows and independent digest", () => {
  const base = { targetPresentBefore: true, status: 204, affectedRows: 0,
    digestBefore: "a", digestAfter: "a" };
  assert.equal(classifyRowDenial(base).status, "PASS");
  assert.equal(classifyRowDenial({ ...base, status: 403 }).status, "PASS");
  assert.equal(classifyRowDenial({ ...base, targetPresentBefore: false }).status, "UNVERIFIED");
  assert.equal(classifyRowDenial({ ...base, digestAfter: null }).status, "UNVERIFIED");
  assert.equal(classifyRowDenial({ ...base, status: 500 }).status, "UNVERIFIED");
  assert.equal(classifyRowDenial({ ...base, affectedRows: 1 }).status, "FAIL");
  assert.equal(classifyRowDenial({ ...base, digestAfter: "b" }).status, "FAIL");
});

test("Storage denial is decided by the existing object's independent persistence", () => {
  const base = { targetPresentBefore: true, targetPresentAfter: true, hashBefore: "a", hashAfter: "a",
    affectedObjects: 0, status: 200, independentMetadataUnchanged: true };
  assert.equal(classifyStorageDenial(base).status, "PASS");
  assert.equal(classifyStorageDenial({ ...base, targetPresentAfter: false, hashAfter: null }).status, "FAIL");
  assert.equal(classifyStorageDenial({ ...base, status: 503 }).status, "UNVERIFIED");
  assert.equal(classifyStorageDenial({ ...base, independentMetadataUnchanged: null }).status, "UNVERIFIED");
  assert.equal(classifyStorageDenial({ ...base, hashAfter: "b" }).status, "FAIL");
});

test("revocation requires the same unexpired JWT and Auth confirmation", () => {
  const payload = Buffer.from(JSON.stringify({ sub: USER, exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  const claims = parseJwtClaims(`e30.${payload}.sig`);
  assert.equal(tokenIsLive(claims), true);
  assert.equal(tokenIsLive(claims, (claims.exp + 1) * 1000), false);
  const base = { sameToken: true, authStatus: 200, live: true, denied: true, unchanged: true };
  assert.equal(classifyRevocation(base).status, "PASS");
  assert.equal(classifyRevocation({ ...base, sameToken: false }).status, "UNVERIFIED");
  assert.equal(classifyRevocation({ ...base, authStatus: 401 }).status, "UNVERIFIED");
  assert.equal(classifyRevocation({ ...base, unchanged: null }).status, "UNVERIFIED");
  assert.equal(classifyRevocation({ ...base, denied: false }).status, "FAIL");
});

test("CSRF request derives one action reference from the rendered form", () => {
  const fields = [["$ACTION_REF_1", "opaque-from-render"], ["$ACTION_1:0", "{}"], ["description", "T070"]];
  const rendered = { actionUrl: PREVIEW.origin + "/admin/products/" + ID, productId: ID, fields };
  const wrong = csrfRequestFromRenderedForm(rendered, "wrong");
  const missing = csrfRequestFromRenderedForm(rendered, "missing");
  assert.equal(wrong.headers.Origin, "https://t070-invalid-origin.invalid");
  assert.deepEqual(missing.headers, {});
  assert.equal(wrong.multipart.get("description"), "T070");
  assert.throws(() => csrfRequestFromRenderedForm({ ...rendered, fields: [["description", "T070"]] }, "wrong"));
  assert.throws(() => csrfRequestFromRenderedForm({ ...rendered, actionUrl: "https://marmixflex.ru/admin/products/" + ID }, "wrong"));
  assert.throws(() => csrfRequestFromRenderedForm({ ...rendered, productId: USER }, "wrong"));
});

test("actual Playwright request construction does not invent Origin", async () => {
  let playwright;
  try { playwright = await import("playwright"); } catch { return test.skip("Playwright install needed"); }
  const seen = [];
  const server = createServer((req, res) => {
    seen.push(req.headers.origin ?? null);
    req.resume(); req.on("end", () => { res.writeHead(403); res.end(); });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const api = await playwright.request.newContext();
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    await api.post(url, { multipart: new FormData(), headers: { Origin: "https://t070-invalid-origin.invalid" },
      maxRedirects: 0 });
    await api.post(url, { multipart: new FormData(), headers: {}, maxRedirects: 0 });
    assert.deepEqual(seen, ["https://t070-invalid-origin.invalid", null]);
  } finally {
    await api.dispose();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("local credential page is loopback-only, GET-only, CSP-bound and no POST sink", async () => {
  await withLocalSignin("sb_publishable_TESTPUBLICKEY123456", async (url) => {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
    assert.match(response.headers.get("content-security-policy"), /connect-src https:\/\/twuevnwxwqdjbjzwuglm\.supabase\.co/);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal((await fetch(url, { method: "POST", body: "password=fake" })).status, 403);
    assert.equal((await fetch(url.replace("/signin", "/other"))).status, 403);
  });
  const html = signinHtml("nonce", "sb_publishable_TESTPUBLICKEY123456");
  assert.doesNotMatch(html, /localStorage|sessionStorage|storageState|\.trace\(/);
  assert.match(html, /form\.elements\.password\.value = ""/);
  assert.match(html, /data\.refresh_token = undefined/);
});

test("report allowlist removes header surprises, rejects secrets and private fields", () => {
  assert.equal(safeHeader("private, no-store, token=do-not-save", "cache"),
    "private, no-store, [omitted]");
  assert.equal(privateCache("private, no-store"), true);
  assert.equal(privateCache("public, s-maxage=60"), false);
  const result = safeResult("admin_headers", { status: "PASS" }, { httpStatus: 200,
    cacheControl: "private, no-store, cookie=private", unchanged: true });
  assert.equal(result.cacheControl, "private, no-store, [omitted]");
  assert.throws(() => safeResult("admin_headers", { status: "PASS" }, { jwt: "secret" }));
  assert.throws(() => safeResult("admin_headers", { status: "PASS" }, { requestBody: "private" }));
  assert.throws(() => safeResult("admin_headers", { status: "PASS" }, { cacheControl: 123 }));
});

test("public configuration discovery rejects missing/ambiguous key or project", () => {
  const key = "sb_publishable_TESTPUBLICKEY123456";
  assert.equal(publicKeyFromAssets([`https://${PREVIEW.projectRef}.supabase.co ${key}`]), key);
  assert.equal(publicKeyFromAssets([key]), null);
  assert.equal(publicKeyFromAssets([PREVIEW.projectRef]), null);
  assert.throws(() => publicKeyFromAssets([`${PREVIEW.projectRef} ${key} sb_publishable_DIFFERENTPUBLIC12345`]));
});

test("browser request guard blocks Production and third-party origins", async () => {
  let handler;
  const blocked = [];
  await restrictContext({ route: async (_pattern, fn) => { handler = fn; } }, (kind) => { blocked.push(kind); });
  const request = (url, method = "GET", type = "script") => {
    let result;
    handler({ request: () => ({ url: () => url, method: () => method, resourceType: () => type }),
      continue: () => { result = "allowed"; },
      abort: () => { result = "blocked"; } });
    return result;
  };
  assert.equal(request(PREVIEW.origin + "/admin/login"), "allowed");
  assert.equal(request(PREVIEW.supabaseOrigin + "/auth/v1/user"), "allowed");
  // The exact script is optional but is still aborted, with no new allowed origin.
  const feedback = "https://vercel.live/_next-live/feedback/feedback.js";
  assert.equal(request(feedback), "blocked");
  assert.equal(requestBoundary({ url: () => feedback, method: () => "GET", resourceType: () => "script" }),
    "optional_feedback");
  assert.equal(request(feedback + "?token=anything"), "blocked");
  assert.equal(request(feedback, "POST"), "blocked");
  assert.equal(request(feedback, "GET", "xhr"), "blocked");
  assert.equal(request("http://127.0.0.1:45678/signin"), "blocked");
  assert.equal(requestBoundary({ url: () => "http://127.0.0.1:45678/signin", method: () => "GET",
    resourceType: () => "document" }), "local_intercept");
  assert.equal(request("https://marmixflex.ru/admin/orders"), "blocked");
  assert.equal(request("https://mc.yandex.ru/metrika/watch.js"), "blocked");
  assert.equal(request("file:///etc/passwd"), "blocked");
  assert.deepEqual(blocked, ["optional_feedback", "unsafe_external", "unsafe_external",
    "unsafe_external", "local_intercept", "unsafe_external", "unsafe_external", "unsafe_external"]);
});

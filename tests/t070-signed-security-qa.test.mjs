import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { runInNewContext } from "node:vm";

import {
  PREVIEW, assertReview, classifyRevocation, classifyRowDenial, classifyStorageDenial,
  csrfRequestFromRenderedForm, exactOrigin, parseArgs, parseJwtClaims, privateCache,
  safeHeader, safeResult, tokenIsLive, validateAuthFixture, validateFixtures,
} from "../scripts/t070-signed-qa-core.mjs";
import { boundedStorageDenial, objectHash, publicKeyFromAssets, reportShell, requestBoundary, restrictContext, signinHtml,
  storageFailureVerdict, withLocalSignin } from "../scripts/t070-signed-security-qa.mjs";
import { RESUME_EXPECTED_COUNTS, RESUME_EXPECTED_REAL_DIGESTS, runStorageDeleteOnly, runStorageOnly,
  validateResumeFixtures, validateResumeSnapshot } from "../scripts/t070-storage-resume.mjs";

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
  assert.deepEqual(parseArgs(["--resume-storage-only", "--review-sha", "a".repeat(40)]),
    { mode: "resume-storage-only", reviewSha: "a".repeat(40) });
  assert.deepEqual(parseArgs(["--resume-storage-delete-only", "--review-sha", "a".repeat(40)]),
    { mode: "resume-storage-delete-only", reviewSha: "a".repeat(40) });
  assert.deepEqual(parseArgs(["--final-p0", "--review-sha", "a".repeat(40)]),
    { mode: "final-p0", reviewSha: "a".repeat(40) });
  assert.throws(() => parseArgs(["--final-p0", "--execute", "--review-sha", "a".repeat(40)]));
  assert.throws(() => parseArgs(["--resume-storage-delete-only", "--execute", "--review-sha", "a".repeat(40)]));
  assert.throws(() => parseArgs(["--resume-storage-only"]));
  assert.throws(() => parseArgs(["--resume-storage-only", "--url", "https://marmixflex.ru"]));
  assert.throws(() => parseArgs(["--resume-storage-only", "--execute", "--review-sha", "a".repeat(40)]));
  assert.throws(() => parseArgs(["--execute"]));
  assert.throws(() => parseArgs(["--dry-run", "--url", "https://marmixflex.ru"]));
});

test("Storage-only report starts empty and never promotes historical SELECT/UPDATE evidence", () => {
  const report = reportShell("resume-storage-only", "a".repeat(40));
  assert.deepEqual(report.results, []);
  assert.equal(report.liveSignedTestsExecuted, false);
  assert.equal(report.newFixturesCreatedByRunner, 0);
  assert.doesNotMatch(JSON.stringify(report), /nonadmin_select|nonadmin_update|Authorization|JWT/);
});

test("Delete-only report contains no historical upload or PATCH PASS", () => {
  const report = reportShell("resume-storage-delete-only", "a".repeat(40));
  assert.deepEqual(report.results, []);
  assert.equal(report.liveSignedTestsExecuted, false);
  assert.doesNotMatch(JSON.stringify(report), /nonadmin_update|storage_only_upload/);
});

const resumeManifest = {
  ...manifest, userId: "ea39d2af-f164-4b2c-a496-502f2464d9af",
  product: { ...manifest.product, baselineDigest: "5aeff7a1c58c7eea983d018e7818b31c" },
  image: { id: "2beefa3e-503d-4118-993a-920268f4d07d",
    path: `products/${ID}/1a01d658-cec9-463a-be9d-53f8a9dd2434.webp`,
    sha256: "5671091f2ffe373f834f309b1c0947ff4f89e8d5b18ed4be9f57adad3560c80e",
    metadataDigest: "7a8d0021adff60af6c07bd6d00e68cc4" },
  order: { ...manifest.order, marker: "T070_QA_SIGNED_20261011" },
};
const resumeCounts = RESUME_EXPECTED_COUNTS.join(",");
const resumeDigests = [resumeManifest.product.baselineDigest, resumeManifest.image.metadataDigest,
  "cf2f1bbedddcb1d5121f82967c268362", ...RESUME_EXPECTED_REAL_DIGESTS,
  "e25b0acc05a0dc20ae0e8d6a81b714ce"].join(",");
const signedToken = (() => {
  const payload = Buffer.from(JSON.stringify({
    sub: resumeManifest.userId, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 1200,
  })).toString("base64url");
  return `e30.${payload}.sig`; // Synthetic parse-only token; no Auth request in tests.
})();

test("Storage resume rejects wrong exact fixtures and an incomplete trusted baseline", () => {
  assert.equal(validateResumeFixtures(structuredClone(resumeManifest)).userId, resumeManifest.userId);
  for (const change of [
    { userId: USER }, { product: { ...resumeManifest.product, id: USER } },
    { image: { ...resumeManifest.image, id: IMAGE } },
    { image: { ...resumeManifest.image, path: PATH } },
    { order: { ...resumeManifest.order, id: USER } },
  ]) assert.throws(() => validateResumeFixtures({ ...resumeManifest, ...change }));
  assert.equal(validateResumeSnapshot(resumeCounts, resumeDigests, resumeManifest), true);
  assert.throws(() => validateResumeSnapshot("", resumeDigests, resumeManifest));
  assert.throws(() => validateResumeSnapshot(resumeCounts.replace("4,1", "4,0"), resumeDigests, resumeManifest));
  assert.throws(() => validateResumeSnapshot(resumeCounts, resumeDigests.replace(
    resumeManifest.image.metadataDigest, "0".repeat(32)), resumeManifest));
  assert.throws(() => validateResumeSnapshot(resumeCounts, resumeDigests.slice(0, -1), resumeManifest));
});

function resumeOps(events, overrides = {}) {
  return {
    authUser: async () => { events.push("auth"); return true; },
    ownMembership: async () => { events.push("membership"); return []; },
    onSigned: () => events.push("signed"),
    trustedSnapshot: async (stage) => { events.push("snapshot:" + stage); },
    objectHash: async (path) => {
      events.push("hash");
      return path === resumeManifest.image.path ? resumeManifest.image.sha256 : null;
    },
    beforeUpload: async (path) => { events.push("upload_approval"); assert.match(path, /^products\/19bbe932-ee48-4306-b7f1-d615a5a64a34\//); },
    upload: async () => { events.push("upload"); return { status: 403 }; },
    afterUpload: async () => { events.push("upload_independent"); },
    beforeDelete: async (path) => { events.push("delete_approval"); assert.equal(path, resumeManifest.image.path); },
    delete: async () => { events.push("delete"); return { status: 200 }; },
    afterDelete: async () => { events.push("delete_independent"); },
    updateFixture: () => { throw Error("PATCH must never be called"); },
    activateAdmin: () => { throw Error("ACTIVE must never be called"); },
    ...overrides,
  };
}

function deleteOps(events, overrides = {}) {
  return {
    authUser: async () => { events.push("auth"); return true; },
    ownMembership: async () => { events.push("membership"); return []; },
    onSigned: () => events.push("signed"),
    trustedSnapshot: async (stage) => {
      events.push("snapshot:" + stage);
      validateResumeSnapshot(resumeCounts, resumeDigests, resumeManifest);
    },
    objectHash: async (path) => {
      events.push("hash");
      assert.equal(path, resumeManifest.image.path);
      return resumeManifest.image.sha256;
    },
    beforeDelete: async (path) => {
      events.push("delete_approval");
      assert.equal(path, resumeManifest.image.path);
    },
    delete: async (path) => {
      events.push("delete");
      assert.equal(path, resumeManifest.image.path);
      return { status: 400, accessDenied: true };
    },
    afterDelete: async () => { events.push("delete_independent"); },
    upload: () => { throw Error("Upload must never be called"); },
    updateFixture: () => { throw Error("PATCH must never be called"); },
    activateAdmin: () => { throw Error("ACTIVE must never be called"); },
    ...overrides,
  };
}

test("Delete-only uses fresh signed non-admin and exact fixture without upload/PATCH/ACTIVE", async () => {
  const events = [];
  assert.deepEqual(await runStorageDeleteOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: deleteOps(events),
  }), { deleteStatus: 400 });
  assert.deepEqual(events.filter((event) => event !== "hash"), [
    "auth", "membership", "signed", "snapshot:before_delete",
    "delete_approval", "delete", "delete_independent",
  ]);
});

test("Delete-only fails closed for wrong fixture, admin membership, bad role or baseline", async () => {
  for (const input of [
    { fixtures: { ...resumeManifest, image: { ...resumeManifest.image, path: PATH } },
      ops: deleteOps([]) },
    { fixtures: resumeManifest, ops: deleteOps([], { ownMembership: async () => [{ is_active: false }] }) },
    { fixtures: resumeManifest, ops: deleteOps([], { trustedSnapshot: async () => {
      validateResumeSnapshot(resumeCounts.replace("4,1", "4,0"), resumeDigests, resumeManifest);
    } }) },
  ]) {
    const events = [];
    await assert.rejects(runStorageDeleteOnly({
      fixtures: input.fixtures, token: signedToken, userId: resumeManifest.userId,
      ops: { ...input.ops, delete: async () => { events.push("delete"); } },
    }));
    assert.equal(events.length, 0);
  }
  const wrongRole = `e30.${Buffer.from(JSON.stringify({
    sub: resumeManifest.userId, role: "service_role", exp: Math.floor(Date.now() / 1000) + 1200,
  })).toString("base64url")}.sig`;
  await assert.rejects(runStorageDeleteOnly({
    fixtures: resumeManifest, token: wrongRole, userId: resumeManifest.userId, ops: deleteOps([]),
  }), /identity/);
});

test("Delete-only never retries an unknown outcome, and detects a removed or changed object", async () => {
  const events = [];
  await assert.rejects(runStorageDeleteOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: deleteOps(events, { delete: async () => { events.push("delete"); throw Error("private"); } }),
  }), (error) => {
    assert.deepEqual(storageFailureVerdict(error), { status: "UNVERIFIED", reason: "outcome_unknown" });
    assert.doesNotMatch(JSON.stringify(safeResult("storage_delete_only", storageFailureVerdict(error))), /private/);
    return true;
  });
  assert.equal(events.filter((event) => event === "delete").length, 1);
  assert.equal(events.includes("delete_independent"), false);
  const changed = [];
  await assert.rejects(runStorageDeleteOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: deleteOps(changed, { objectHash: async () => {
      changed.push("hash");
      return changed.includes("delete") ? null : resumeManifest.image.sha256;
    } }),
  }), (error) => error.securityViolation === true);
  assert.equal(changed.filter((event) => event === "delete").length, 1);
});

test("Only exact legacy 400 AccessDenied is a bounded denial, never generic 400", async () => {
  const response = (code, status = 400) => new Response(JSON.stringify({ code }), {
    status, headers: { "content-type": "application/json" },
  });
  assert.deepEqual(await boundedStorageDenial(response("AccessDenied")),
    { status: 400, accessDenied: true });
  for (const r of [response("NoSuchKey"), response("InvalidKey"),
    new Response("AccessDenied", { status: 400 }), response("AccessDenied", 403)]) {
    assert.equal((await boundedStorageDenial(r)).accessDenied, false);
  }
  const events = [];
  await assert.rejects(runStorageDeleteOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: deleteOps(events, { delete: async () => {
      events.push("delete"); return { status: 400, accessDenied: false };
    } }),
  }));
  assert.equal(events.filter((event) => event === "delete").length, 1);
});

test("Storage-only phase uses fresh signed identity, separate approvals, and never PATCH/ACTIVE", async () => {
  const events = [];
  assert.deepEqual(await runStorageOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: resumeOps(events),
  }), { uploadStatus: 403, deleteStatus: 200 });
  assert.deepEqual(events.filter((event) => event !== "hash"), [
    "auth", "membership", "signed", "snapshot:before_upload", "upload_approval",
    "upload", "upload_independent", "delete_approval", "delete", "delete_independent",
  ]);
  assert.equal(events.includes("PATCH"), false);
  assert.equal(events.includes("ACTIVE"), false);
});

test("Storage-only phase stops before any mutation on absent Admin baseline", async () => {
  const events = [];
  await assert.rejects(runStorageOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: resumeOps(events, { ownMembership: async () => [{ is_active: true }] }),
  }), /membership/);
  assert.equal(events.includes("upload"), false);
  assert.equal(events.includes("delete"), false);
});

test("Ambiguous upload outcome never retries or reaches delete; sanitized verdict remains UNVERIFIED", async () => {
  const events = [];
  await assert.rejects(runStorageOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: resumeOps(events, { upload: async () => { events.push("upload"); throw Error("private response"); } }),
  }), (error) => {
    assert.equal(error.storageStage, "mutation");
    assert.deepEqual(storageFailureVerdict(error), { status: "UNVERIFIED", reason: "outcome_unknown" });
    assert.doesNotMatch(JSON.stringify(safeResult("storage_only", storageFailureVerdict(error))), /private/);
    return true;
  });
  assert.equal(events.filter((event) => event === "upload").length, 1);
  assert.equal(events.includes("delete"), false);
  assert.equal(events.includes("delete_approval"), false);
});

test("Unexpected created object is FAIL and prevents delete; changed existing WebP is FAIL", async () => {
  const created = [];
  await assert.rejects(runStorageOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: resumeOps(created, { objectHash: async (path) => {
      created.push("hash");
      return path === resumeManifest.image.path ? resumeManifest.image.sha256 :
        created.includes("upload") ? "a".repeat(64) : null;
    } }),
  }), (error) => error.securityViolation === true);
  assert.equal(created.filter((event) => event === "upload").length, 1);
  assert.equal(created.includes("delete"), false);

  const removed = [];
  await assert.rejects(runStorageOnly({
    fixtures: resumeManifest, token: signedToken, userId: resumeManifest.userId,
    ops: resumeOps(removed, { objectHash: async (path) => {
      removed.push("hash");
      return path === resumeManifest.image.path ?
        removed.includes("delete") ? null : resumeManifest.image.sha256 : null;
    } }),
  }), (error) => error.securityViolation === true);
  assert.equal(removed.filter((event) => event === "delete").length, 1);
  assert.equal(removed.includes("delete_independent"), false);
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

test("Storage exact-path absence requires NoSuchKey, never a generic 400 or authorization error", async () => {
  const bytes = Buffer.from("synthetic WebP bytes");
  const expected = (await import("node:crypto")).createHash("sha256").update(bytes).digest("hex");
  const mock = (status, body) => async (url) => {
    assert.equal(new URL(url).pathname, `/storage/v1/object/public/${PREVIEW.bucket}/${PATH}`);
    return new Response(body, { status });
  };
  assert.equal(await objectHash(PATH, mock(200, bytes)), expected);
  assert.equal(await objectHash(PATH, mock(404, JSON.stringify({ code: "NoSuchKey" }))), null);
  assert.equal(await objectHash(PATH, mock(400, JSON.stringify({ code: "NoSuchKey" }))), null);
  for (const [status, body] of [
    [400, JSON.stringify({ code: "InvalidKey" })], [400, "not JSON"],
    [400, JSON.stringify({ message: "NoSuchKey" })], [403, JSON.stringify({ code: "NoSuchKey" })],
    [500, JSON.stringify({ code: "NoSuchKey" })], [404, "not JSON"],
  ]) await assert.rejects(objectHash(PATH, mock(status, body)), /Storage object verification unavailable/);
  await assert.rejects(objectHash(`products/${USER}/test.webp`, mock(400, "{}")), /outside exact TEST_ONLY/);
  await assert.rejects(objectHash(PATH, async () => { throw Object.assign(new Error("private"),
    { name: "TimeoutError" }); }), /private/);
});

test("Storage preflight failures are distinct from mutation timeouts in sanitized verdicts", () => {
  assert.deepEqual(storageFailureVerdict({ storageStage: "preflight", name: "TimeoutError" }),
    { status: "UNVERIFIED", reason: "preflight_timeout" });
  assert.deepEqual(storageFailureVerdict({ storageStage: "preflight", name: "Error" }),
    { status: "UNVERIFIED", reason: "preflight_failed" });
  assert.deepEqual(storageFailureVerdict({ storageStage: "mutation", name: "TimeoutError" }),
    { status: "UNVERIFIED", reason: "timeout_unknown" });
  assert.deepEqual(storageFailureVerdict({ storageStage: "mutation", name: "Error" }),
    { status: "UNVERIFIED", reason: "outcome_unknown" });
  assert.deepEqual(storageFailureVerdict({ securityViolation: true }),
    { status: "FAIL", reason: "unexpected_response" });
  for (const reason of ["preflight_timeout", "preflight_failed", "outcome_unknown"]) {
    const result = safeResult("nonadmin_storage", { status: "UNVERIFIED", reason });
    assert.equal(result.reason, reason);
    assert.equal(JSON.stringify(result).includes("private"), false);
  }
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

async function simulatedSignin(responseFactory, enteredKey) {
  const publicKey = "sb_publishable_TESTPUBLICKEY123456";
  const email = "t070-synthetic-test@example.invalid";
  const fields = {
    publishable: { value: publicKey },
    email: { value: email, readOnly: true },
    password: { value: "temporary-password" },
  };
  let onSubmit;
  let delivered = 0;
  const state = { textContent: "" };
  const button = { disabled: true };
  const form = { elements: fields, addEventListener: (_type, callback) => { onSubmit = callback; } };
  const document = { getElementById: (id) => ({ state, submit: button, login: form })[id] };
  const html = signinHtml("nonce", publicKey, email);
  const inlineScript = html.match(/<script nonce="nonce">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inlineScript);
  const fetch = async (url) => url.endsWith("/auth/v1/health") ?
    { type: "basic", status: 200 } : responseFactory();
  runInNewContext(inlineScript, {
    document, fetch, window: { __t070Deliver: async () => { delivered++; } },
    AbortSignal, setTimeout, clearTimeout,
  });
  await new Promise(setImmediate);
  assert.equal(button.disabled, false);
  if (enteredKey) fields.publishable.value = enteredKey;
  await onSubmit({ preventDefault() {} });
  return { fields, state: state.textContent, button, delivered, publicKey, email };
}

test("local Auth failure preserves readonly email and public key, clears password, and classifies status", async () => {
  const result = await simulatedSignin(() => ({ ok: false, status: 401 }));
  assert.equal(result.fields.email.value, result.email);
  assert.equal(result.fields.publishable.value, result.publicKey);
  assert.equal(result.fields.password.value, "");
  assert.match(result.state, /HTTP 401/);
  assert.equal(result.button.disabled, false);
  assert.equal(result.delivered, 0);
});

test("local Auth network, timeout, and malformed success show bounded diagnostics", async () => {
  for (const [response, label] of [
    [() => Promise.reject(new Error("private response body must never appear")), "Сетевая ошибка"],
    [() => Promise.reject(Object.assign(new Error("private timeout"), { name: "TimeoutError" })), "Превышено время ожидания"],
    [() => ({ ok: true, status: 200, json: async () => { throw new Error("private JSON"); } }), "Некорректный ответ Auth"],
    [() => ({ ok: true, status: 200, json: async () => ({ user: {} }) }), "Некорректный ответ Auth"],
  ]) {
    const result = await simulatedSignin(response);
    assert.match(result.state, new RegExp(label));
    assert.doesNotMatch(result.state, /private|temporary-password|Bearer|JWT/i);
    assert.equal(result.fields.email.value, result.email);
    assert.equal(result.fields.publishable.value, result.publicKey);
    assert.equal(result.fields.password.value, "");
    assert.equal(result.delivered, 0);
  }
});

test("local Auth clears password before key validation and delivers only a valid session", async () => {
  const invalid = await simulatedSignin(() => { throw Error("Auth request must not run"); }, "not-a-publishable-key");
  assert.equal(invalid.fields.password.value, "");
  assert.equal(invalid.fields.email.value, invalid.email);
  assert.equal(invalid.fields.publishable.value, "not-a-publishable-key");
  assert.match(invalid.state, /Публичный ключ Preview не подтверждён/);

  const success = await simulatedSignin(() => ({ ok: true, status: 200,
    json: async () => ({ access_token: "synthetic-token", refresh_token: "synthetic-refresh",
      user: { id: USER } }) }));
  assert.equal(success.delivered, 1);
  assert.equal(success.fields.password.value, "");
  assert.equal(success.fields.email.value, "");
  assert.equal(success.fields.publishable.value, "");
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


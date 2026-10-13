import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { PREVIEW } from "../scripts/t070-signed-qa-core.mjs";
import { csrfHeaders, reportShell } from "../scripts/t070-signed-security-qa.mjs";
import { P0_EXPECTED_COUNTS, runFinalP0, validateP0Snapshot } from "../scripts/t070-final-p0.mjs";
import { RESUME_EXPECTED_REAL_DIGESTS } from "../scripts/t070-storage-resume.mjs";

const user = "ea39d2af-f164-4b2c-a496-502f2464d9af";
const product = "19bbe932-ee48-4306-b7f1-d615a5a64a34";
const path = `products/${product}/1a01d658-cec9-463a-be9d-53f8a9dd2434.webp`;
const fixtures = {
  origin: PREVIEW.origin, deploymentSha: PREVIEW.deploymentSha, projectRef: PREVIEW.projectRef,
  approval: "OWNER_APPROVED_T070_SIGNED_EXECUTION", userId: user,
  userEmail: "t070-signed-20261010@example.invalid",
  product: { id: product, sku: "TEST_ONLY-T070-19BBE932", slug: "t070-qa-product-20261009",
    catalogKind: "TEST_ONLY", isPublished: false, baselineDigest: "5aeff7a1c58c7eea983d018e7818b31c" },
  image: { id: "2beefa3e-503d-4118-993a-920268f4d07d", path,
    sha256: "5671091f2ffe373f834f309b1c0947ff4f89e8d5b18ed4be9f57adad3560c80e",
    metadataDigest: "7a8d0021adff60af6c07bd6d00e68cc4" },
  order: { id: "a8b701e4-7a1c-4f0c-8583-4195ed819278", marker: "T070_QA_SIGNED_20261011" },
};
const digests = [fixtures.product.baselineDigest, fixtures.image.metadataDigest,
  "cf2f1bbedddcb1d5121f82967c268362", ...RESUME_EXPECTED_REAL_DIGESTS,
  "e25b0acc05a0dc20ae0e8d6a81b714ce"].join(",");
const token = `e30.${Buffer.from(JSON.stringify({ sub: user, role: "authenticated",
  exp: Math.floor(Date.now() / 1000) + 1200 })).toString("base64url")}.signature`;

function operations(events, changes = {}) {
  let phase = "absent";
  const base = {
    snapshot: async (stage, requested) => {
      events.push(`snapshot:${stage}`);
      assert.equal(requested, phase);
      return validateP0Snapshot(P0_EXPECTED_COUNTS[phase].join(","), digests, fixtures, requested);
    },
    authUser: async (bearer) => { events.push("auth"); assert.equal(bearer, token); return true; },
    membership: async () => phase === "absent" ? [] : [{ user_id: user, is_active: phase === "active" }],
    objectHash: async (key) => { assert.equal(key, path); return fixtures.image.sha256; },
    onSigned: () => events.push("signed"),
    beforeActive: async () => { events.push("active_checkpoint"); phase = "active"; },
    read: async (bearer, table, id) => {
      assert.equal(bearer, token);
      events.push(`read:${phase}:${table}`);
      if (phase === "revoked") return { status: 200, rows: [] };
      return { status: 200, rows: table === "products" ?
        [{ id, catalog_kind: "TEST_ONLY", is_published: false }] : [{ id }] };
    },
    storageList: async () => {
      events.push(`list:${phase}`);
      return { status: 200, rows: phase === "active" ? [{ name: path.split("/").at(-1) }] : [] };
    },
    adminBrowser: async () => {
      events.push("privacy");
      return { headersPass: true, signedMarkerPresent: true,
        anonymousMarkerAbsent: true, publicChunksComplete: true };
    },
    beforeCsrf: async (mode) => events.push(`csrf_approval:${mode}`),
    csrf: async (mode) => { events.push(`csrf:${mode}`); return { status: 403 }; },
    beforeRevoke: async () => { events.push("revoke_checkpoint"); phase = "revoked"; },
    revokedRoute: async () => { events.push("route"); return true; },
    record: (name, status) => { assert.equal(status, "PASS"); events.push(`verdict:${name}`); },
    upload: () => { throw Error("Historical upload must not run"); },
    delete: () => { throw Error("Historical DELETE must not run"); },
    updateFixture: () => { throw Error("Historical PATCH must not run"); },
  };
  return { ...base, ...changes };
}

test("finite P0 phase order and no repeated historical mutations", async () => {
  const events = [];
  assert.equal(await runFinalP0({ fixtures, token, userId: user, ops: operations(events) }), true);
  const index = (needle) => events.indexOf(needle);
  assert(index("snapshot:before_signin") < index("active_checkpoint"));
  assert(index("active_checkpoint") < index("verdict:active_admin_reads"));
  assert(index("privacy") < index("csrf_approval:wrong"));
  assert(index("csrf:wrong") < index("csrf_approval:missing"));
  assert(index("csrf:missing") < index("revoke_checkpoint"));
  assert(index("revoke_checkpoint") < index("read:revoked:products"));
  assert.equal(index("snapshot:final"), events.length - 1);
  assert.equal(events.filter((value) => value.startsWith("csrf:")).length, 2);
});

test("phase counts and all 14 digests fail closed", () => {
  for (const phase of ["absent", "active", "revoked"]) {
    assert.equal(validateP0Snapshot(P0_EXPECTED_COUNTS[phase].join(","), digests, fixtures, phase), true);
    assert.throws(() => validateP0Snapshot(P0_EXPECTED_COUNTS[phase].join(","),
      digests.replace("326c9f26f1bac9b1a5e0ea57dcec26d2", "0".repeat(32)), fixtures, phase));
  }
  assert.throws(() => validateP0Snapshot(P0_EXPECTED_COUNTS.active.join(","), digests, fixtures, "revoked"));
  assert.throws(() => validateP0Snapshot("", digests, fixtures, "active"));
});

test("final P0 report starts empty and Node CSRF form sends exact Origin modes", async () => {
  const report = reportShell("final-p0", "a".repeat(40));
  assert.deepEqual(report.results, []);
  assert.equal(report.liveSignedTestsExecuted, false);
  assert.doesNotMatch(JSON.stringify(report), /nonadmin_update|storage_only_upload|storage_delete_only/);
  const requests = [];
  const server = createServer((req, res) => {
    requests.push({ origin: req.headers.origin, hasCookie: Boolean(req.headers.cookie) });
    req.resume(); res.writeHead(403); res.end();
  });
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    for (const mode of ["wrong", "missing"]) {
      const form = new FormData(); form.append("description", "synthetic");
      const response = await fetch(url, { method: "POST", headers: csrfHeaders("test=safe", mode), body: form });
      assert.equal(response.status, 403);
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
  assert.deepEqual(requests, [
    { origin: "https://t070-invalid-origin.invalid", hasCookie: true },
    { origin: undefined, hasCookie: true },
  ]);
  assert.throws(() => csrfHeaders("", "missing"));
  assert.throws(() => csrfHeaders("test=safe", "other"));
});

test("no CSRF without per-attempt approval and unchanged exact fixture", async () => {
  for (const changes of [
    { beforeCsrf: async () => { throw Error("Owner did not approve"); } },
    { csrf: async () => ({ status: 200 }) },
    { snapshot: async (stage, phase) => stage === "after_csrf_wrong" ?
      undefined : validateP0Snapshot(P0_EXPECTED_COUNTS[phase].join(","), digests, fixtures, phase) },
    { csrf: async () => { throw Error("Unknown request outcome"); } },
  ]) {
    const events = [];
    await assert.rejects(runFinalP0({ fixtures, token, userId: user,
      ops: operations(events, changes) }));
    assert.equal(events.includes("revoke_checkpoint"), false);
  }
});

test("invalid signed identity, absent Owner baseline, incomplete privacy and invalid revocation stop", async () => {
  const failCases = [
    { authUser: async () => false },
    { snapshot: async () => { throw Error("REAL digest mismatch"); } },
    { adminBrowser: async () => ({ headersPass: false, signedMarkerPresent: true,
      anonymousMarkerAbsent: true, publicChunksComplete: true }) },
    { beforeRevoke: async () => { throw Error("Owner did not approve"); } },
    { revokedRoute: async () => false },
  ];
  for (const changes of failCases) {
    const events = [];
    await assert.rejects(runFinalP0({ fixtures, token, userId: user,
      ops: operations(events, changes) }));
  }
  await assert.rejects(runFinalP0({ fixtures, token, userId: "01a6213d-85dc-4851-829c-9d2ee0f30af0",
    ops: operations([]) }));
});

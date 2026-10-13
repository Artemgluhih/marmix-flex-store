import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { PREVIEW, parseArgs, safeResult } from "../scripts/t070-signed-qa-core.mjs";
import { classifyAnonymousOrders, csrfHeaders, reportShell } from "../scripts/t070-signed-security-qa.mjs";
import { P0_EXPECTED_COUNTS, p0FailureResult, runFinalP0, runResumeFinalP0, P0_LIFETIME_BUDGET, validateP0Snapshot } from "../scripts/t070-final-p0.mjs";
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

function operations(events, changes = {}, resume = false, bearer = token) {
  let phase = resume ? "inactive" : "absent";
  const expectedBearer = bearer;
  const base = {
    snapshot: async (stage, requested) => {
      events.push(`snapshot:${stage}`);
      assert.equal(requested, phase);
      return validateP0Snapshot(P0_EXPECTED_COUNTS[phase].join(","), digests, fixtures, requested);
    },
    authUser: async (bearer) => { events.push("auth"); assert.equal(bearer, expectedBearer); return true; },
    authUserResponse: async (bearer) => { assert.equal(bearer, expectedBearer); events.push("auth_response"); return { status: 200, valid: true }; },
    recordResult: (result) => { assert.equal(result.status, "PASS"); events.push(`budget:${result.name}`); },
    membership: async () => ({ status: 200, rows: phase === "absent" ? [] :
      [{ user_id: user, is_active: phase === "active" }] }),
    objectHash: async (key) => { assert.equal(key, path); return fixtures.image.sha256; },
    onSigned: () => events.push("signed"),
    beforeActive: async () => { events.push("active_checkpoint"); phase = "active"; },
    read: async (bearer, table, id) => {
      assert.equal(bearer, expectedBearer);
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

test("anonymous direct Orders SELECT fails for any row, even if marker is in an unselected field", () => {
  assert.equal(classifyAnonymousOrders(200, "[]", fixtures.order.marker), true);
  assert.equal(classifyAnonymousOrders(200, '[{"id":"synthetic"}]', fixtures.order.marker), false);
  assert.equal(classifyAnonymousOrders(200,
    JSON.stringify([{ name: fixtures.order.marker }]), fixtures.order.marker), false);
  assert.equal(classifyAnonymousOrders(200, "{}", fixtures.order.marker), false);
  assert.equal(classifyAnonymousOrders(403, "denied", fixtures.order.marker), true);
  assert.equal(classifyAnonymousOrders(401, fixtures.order.marker, fixtures.order.marker), false);
  assert.throws(() => classifyAnonymousOrders(200, "broken", fixtures.order.marker));
  assert.throws(() => classifyAnonymousOrders(500, "[]", fixtures.order.marker));
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

test("JWT expiring during ACTIVE checkpoint stops before membership/read requests without refresh", async (t) => {
  const events = [];
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const ops = operations(events);
  const originalActive = ops.beforeActive;
  ops.beforeActive = async () => { await originalActive(); now += 2 * 60 * 60 * 1000; };
  await assert.rejects(runFinalP0({ fixtures, token, userId: user, ops }), (error) => {
    assert.deepEqual(p0FailureResult(error), {
      name: "p0_active_token", status: "UNVERIFIED", reason: "expired_token", tokenLive: false,
    });
    return true;
  });
  assert.equal(events.some((value) => value.startsWith("read:") || value.startsWith("list:")), false);
  assert.equal(events.includes("csrf_approval:wrong"), false);
});

test("membership HTTP failure retains bounded phase/status rather than null or timeout_unknown", async () => {
  const events = [];
  let membershipCalls = 0;
  const ops = operations(events, { membership: async () => ++membershipCalls === 1 ?
    { status: 200, rows: [] } : { status: 401, rows: null } });
  await assert.rejects(runFinalP0({ fixtures, token, userId: user, ops }), (error) => {
    assert.deepEqual(p0FailureResult(error), {
      name: "p0_active_membership", status: "UNVERIFIED", reason: "auth_not_confirmed", httpStatus: 401,
    });
    return true;
  });
  assert.equal(membershipCalls, 2);
  assert.equal(events.some((value) => value.startsWith("read:") || value.startsWith("list:")), false);
  assert.doesNotMatch(JSON.stringify(p0FailureResult(new Error("JWT=private; Cookie=secret"))), /private|secret|JWT|Cookie/);
});

test("final P0 report label and bounded P0 stage labels pass sanitizer without permitting arbitrary identifiers", () => {
  assert.equal(safeResult("final_p0", { status: "UNVERIFIED", reason: "expired_token" }).name, "final_p0");
  assert.equal(safeResult("p0_active_token", { status: "UNVERIFIED", reason: "expired_token" }).name, "p0_active_token");
  assert.throws(() => safeResult("JWT_123_private", { status: "PASS" }));
  assert.throws(() => safeResult("p0_http_401", { status: "PASS" }));
});

test("active product/order/Storage shape failures identify exact phase and stop later requests", async () => {
  for (const [phase, target] of [["p0_active_product", "products"], ["p0_active_order", "order_requests"],
    ["p0_active_storage", "storage"]]) {
    const events = [];
    const ops = operations(events);
    const originalRead = ops.read;
    ops.read = async (bearer, table, id) => table === target ?
      { status: 200, rows: [] } : originalRead(bearer, table, id);
    if (target === "storage") ops.storageList = async () => ({ status: 400, rows: null });
    await assert.rejects(runFinalP0({ fixtures, token, userId: user, ops }), (error) => {
      assert.equal(p0FailureResult(error).name, phase);
      assert.equal(p0FailureResult(error).reason, "unexpected_response");
      return true;
    });
    assert.equal(events.includes("privacy"), false);
    assert.equal(events.includes("revoke_checkpoint"), false);
  }
});


function freshToken(seconds = 3600, overrides = {}) {
  return `e30.${Buffer.from(JSON.stringify({ sub: user, role: "authenticated",
    iss: `${PREVIEW.supabaseOrigin}/auth/v1`, aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + seconds, ...overrides })).toString("base64url")}.signature`;
}

async function resumeFailure(changes, seconds = 3600) {
  const events = [];
  const bearer = freshToken(seconds);
  let failure;
  await assert.rejects(runResumeFinalP0({ fixtures, token: bearer, userId: user,
    ops: operations(events, changes, true, bearer) }), (error) => { failure = p0FailureResult(error); return true; });
  return { events, failure };
}

test("resume CLI is separate and rejects mode combinations or arbitrary targets", () => {
  assert.deepEqual(parseArgs(["--resume-final-p0", "--review-sha", "a".repeat(40)]),
    { mode: "resume-final-p0", reviewSha: "a".repeat(40) });
  assert.throws(() => parseArgs(["--resume-final-p0", "--execute", "--review-sha", "a".repeat(40)]));
  assert.throws(() => parseArgs(["--resume-final-p0", "--product", product]));
  assert.throws(() => validateP0Snapshot(P0_EXPECTED_COUNTS.absent.join(","), digests, fixtures, "inactive"));
  assert.throws(() => validateP0Snapshot(P0_EXPECTED_COUNTS.active.join(","), digests, fixtures, "inactive"));
});

test("resume starts with inactive membership, fresh signed claims and same frozen bearer through revocation", async () => {
  const events = [];
  const bearer = freshToken();
  const responses = [];
  const ops = operations(events, { record: (name, status, httpStatus) => {
    responses.push(safeResult(name, { status }, httpStatus == null ? {} : { httpStatus }));
  } }, true, bearer);
  assert.equal(await runResumeFinalP0({ fixtures, token: bearer, userId: user, ops }), true);
  for (const name of ["p0_initial_auth", "p0_initial_membership", "p0_active_product", "p0_active_order",
    "p0_active_storage", "p0_revoked_product", "p0_revoked_order", "p0_revoked_storage"]) {
    assert.equal(responses.find((result) => result.name === name)?.httpStatus, 200);
  }
  assert.equal(events.filter((event) => event.startsWith("csrf:")).length, 2);
  assert.equal(events.filter((event) => event === "active_checkpoint").length, 1);
  assert.equal(events.filter((event) => event === "revoke_checkpoint").length, 1);
  assert.equal(events.filter((event) => event === "auth_response").length, 2);
  assert.equal(events.includes("budget:p0_before_activation"), true);
  assert.equal(events.includes("budget:p0_revoked_budget"), true);
  assert.doesNotMatch(JSON.stringify(responses), /nonadmin_update|storage_delete_only|signature|access_token/);
});

test("resume rejects absent/active temporary membership, missing Owner baseline and changed exact fixtures before activation", async () => {
  for (const changes of [
    { membership: async () => ({ status: 200, rows: [] }) },
    { membership: async () => ({ status: 200, rows: [{ user_id: user, is_active: true }] }) },
    { snapshot: async () => validateP0Snapshot(P0_EXPECTED_COUNTS.inactive.join(","),
      digests.replace("e25b0acc05a0dc20ae0e8d6a81b714ce", "0".repeat(32)), fixtures, "inactive") },
    { objectHash: async () => "0".repeat(64) },
  ]) {
    const { events, failure } = await resumeFailure(changes);
    assert.equal(events.includes("active_checkpoint"), false);
    assert.equal(failure.recoveryRequired, false);
  }
  await assert.rejects(runResumeFinalP0({ fixtures: { ...fixtures, image: { ...fixtures.image, path: "products/other/test.webp" } },
    token: freshToken(), userId: user, ops: operations([]) }));
});

test("resume validates Preview JWT subject, authenticated role, issuer, audience and Auth user endpoint", async () => {
  for (const overrides of [
    { iss: "https://production.invalid/auth/v1" }, { iss: undefined },
    { aud: "service_role" }, { aud: undefined }, { aud: ["authenticated", "service_role"] }, { role: "anon" },
    { sub: "01a6213d-85dc-4851-829c-9d2ee0f30af0" },
  ]) {
    const events = [];
    const bearer = freshToken(3600, overrides);
    await assert.rejects(runResumeFinalP0({ fixtures, token: bearer, userId: user,
      ops: operations(events, {}, true, bearer) }));
    assert.equal(events.includes("active_checkpoint"), false);
  }
  const { events, failure } = await resumeFailure({ authUserResponse: async () => ({ status: 401, valid: false }) });
  assert.equal(failure.name, "p0_initial_auth"); assert.equal(failure.httpStatus, 401);
  assert.equal(events.includes("active_checkpoint"), false);
});

test("insufficient JWT budget stops before activation and emits only bounded lifetime counters", async () => {
  const { events, failure } = await resumeFailure({}, P0_LIFETIME_BUDGET.activation - 1);
  assert.equal(events.includes("active_checkpoint"), false);
  assert.equal(failure.reason, "insufficient_lifetime");
  assert.equal(failure.requiredSeconds, 1800); assert.equal(failure.recoveryRequired, false);
  assert(failure.remainingSeconds < 1800);
  assert.doesNotMatch(JSON.stringify(failure), /signature|exp|issuer|Cookie|JWT/);
});

test("JWT expiry during activation requires exact revocation recovery and sends no active reads", async (t) => {
  const events = []; let now = Date.now(); t.mock.method(Date, "now", () => now);
  const bearer = freshToken();
  const ops = operations(events, {}, true, bearer);
  const activate = ops.beforeActive;
  ops.beforeActive = async () => { await activate(); now += 3700 * 1000; };
  await assert.rejects(runResumeFinalP0({ fixtures, token: bearer, userId: user, ops }), (error) => {
    const failure = p0FailureResult(error);
    assert.equal(failure.name, "p0_active_token"); assert.equal(failure.reason, "expired_token");
    assert.equal(failure.recoveryRequired, true); return true;
  });
  assert.equal(events.some((event) => event.startsWith("read:")), false);
  assert.equal(events.includes("csrf:wrong"), false);
});

test("JWT budget rechecked AFTER CSRF approval, no mutation if manual approval consumed time", async (t) => {
  let now = Date.now(); t.mock.method(Date, "now", () => now);
  const { events, failure } = await resumeFailure({ beforeCsrf: async () => { now += 2800 * 1000; } });
  assert.equal(failure.name, "p0_csrf_wrong_approved"); assert.equal(failure.reason, "insufficient_lifetime");
  assert.equal(failure.recoveryRequired, true);
  assert.equal(events.some((event) => event.startsWith("csrf:")), false);
});

test("approved activation/revocation recheck budgets before external operator is told to write", async (t) => {
  let now = Date.now(); t.mock.method(Date, "now", () => now);
  const before = await resumeFailure({ beforeActive: async (guard) => { now += 1900 * 1000; guard(); } });
  assert.equal(before.failure.name, "p0_activation_approved");
  assert.equal(before.events.some((event) => event.startsWith("read:")), false);
  now -= 1900 * 1000;
  const after = await resumeFailure({ beforeRevoke: async (guard) => { now += 3400 * 1000; guard(); } });
  assert.equal(after.failure.name, "p0_revocation_approved");
  assert.equal(after.failure.recoveryRequired, true);
});

test("same frozen JWT expiry AFTER independently confirmed revocation stays UNVERIFIED, no new JWT or retry", async (t) => {
  let now = Date.now(); t.mock.method(Date, "now", () => now);
  const events = []; const bearer = freshToken();
  const ops = operations(events, {}, true, bearer); const revoke = ops.beforeRevoke;
  ops.beforeRevoke = async () => { await revoke(); now += 3700 * 1000; };
  await assert.rejects(runResumeFinalP0({ fixtures, token: bearer, userId: user, ops }), (error) => {
    const failure = p0FailureResult(error); assert.equal(failure.reason, "expired_token");
    assert.equal(failure.recoveryRequired, false); return true;
  });
  assert.equal(events.filter((event) => event === "auth_response").length, 1);
  assert.equal(events.includes("read:revoked:products"), false);
});

test("resume CSRF unknown outcome stops after independent snapshot, one request, recovery required", async () => {
  let attempts = 0;
  const { events, failure } = await resumeFailure({ csrf: async () => { attempts++; throw Error("secret response unknown"); } });
  assert.equal(attempts, 1); assert.equal(failure.name, "p0_csrf_wrong");
  assert.equal(failure.reason, "outcome_unknown"); assert.equal(failure.recoveryRequired, true);
  assert.equal(events.includes("snapshot:after_csrf_wrong_unknown"), true);
  assert.equal(events.includes("csrf_approval:missing"), false);
  assert.doesNotMatch(JSON.stringify(failure), /secret response/);
});

test("revoked resource exposure fails separately, read-only Storage list never replaces historical mutations", async () => {
  const events = []; const bearer = freshToken(); const ops = operations(events, {}, true, bearer);
  const read = ops.read;
  ops.read = async (jwt, table, id) => events.includes("revoke_checkpoint") ?
    { status: 200, rows: [{ id }] } : read(jwt, table, id);
  await assert.rejects(runResumeFinalP0({ fixtures, token: bearer, userId: user, ops }), (error) => {
    const failure = p0FailureResult(error); assert.equal(failure.name, "p0_revoked_product");
    assert.equal(failure.status, "FAIL"); assert.equal(failure.httpStatus, 200); return true;
  });
  assert.equal(events.includes("list:revoked"), false);
});

test("resume report allows safe budgets/recovery only and never imports historical PASS into new report", () => {
  assert.equal(safeResult("resume_final_p0", { status: "UNVERIFIED", reason: "insufficient_lifetime" },
    { remainingSeconds: 250, requiredSeconds: 300, recoveryRequired: true }).requiredSeconds, 300);
  assert.throws(() => safeResult("resume_final_p0", { status: "PASS" }, { token: "secret" }));
  assert.throws(() => safeResult("resume_final_p0", { status: "PASS" }, { remainingSeconds: Infinity }));
  assert.throws(() => safeResult("resume_final_p0", { status: "PASS" }, { recoveryRequired: "true" }));
  const report = reportShell("resume-final-p0", "a".repeat(40)); assert.deepEqual(report.results, []);
  assert.equal(report.liveSignedTestsExecuted, false);
});


test("standard single authenticated JWT audience array is allowed without widening the audience", async () => {
  const bearer = freshToken(3600, { aud: ["authenticated"] });
  assert.equal(await runResumeFinalP0({ fixtures, token: bearer, userId: user,
    ops: operations([], {}, true, bearer) }), true);
});

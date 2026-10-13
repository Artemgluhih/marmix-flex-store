import { PREVIEW, parseJwtClaims, tokenIsLive, validateFixtures } from "./t070-signed-qa-core.mjs";
import { RESUME_EXPECTED_COUNTS, validateResumeFixtures, validateResumeSnapshot } from "./t070-storage-resume.mjs";

const TEMP_USER = "ea39d2af-f164-4b2c-a496-502f2464d9af";
const PHASE_COUNTS = Object.freeze({
  absent: RESUME_EXPECTED_COUNTS,
  active: Object.freeze(RESUME_EXPECTED_COUNTS.map((n, i) => i === 8 ? 2 : i === 9 ? 1 : n)),
  revoked: Object.freeze(RESUME_EXPECTED_COUNTS.map((n, i) => i === 9 ? 1 : n)),
});

export function validateP0Snapshot(counts, digests, fixtures, phase) {
  validateResumeFixtures(fixtures);
  const expected = PHASE_COUNTS[phase];
  if (!expected) throw new Error("Unknown P0 membership phase");
  const actual = counts.split(",").map((value) => value.trim());
  if (actual.length !== expected.length || actual.some((value, i) =>
    !/^(0|[1-9]\d*)$/.test(value) || Number(value) !== expected[i])) {
    throw new Error("Trusted P0 phase count mismatch");
  }
  // The same 14 fixture, REAL and Owner membership digests are checked in
  // every phase. Only the two temporary membership counts may change.
  validateResumeSnapshot(RESUME_EXPECTED_COUNTS.join(","), digests, fixtures);
  return true;
}

function expectRows(value, count) {
  return value?.status === 200 && Array.isArray(value.rows) && value.rows.length === count;
}

function expectMembership(value, active) {
  return Array.isArray(value) && value.length === 1 &&
    value[0].user_id === TEMP_USER && value[0].is_active === active;
}

// All operations are injected to allow a network-free self-test. This finite
// path has no PATCH, upload, DELETE or fixture cleanup operation.
export async function runFinalP0({ fixtures, token, userId, ops }) {
  validateFixtures(fixtures);
  validateResumeFixtures(fixtures);
  const frozenToken = token;
  const claims = parseJwtClaims(frozenToken);
  if (claims.sub !== TEMP_USER || userId !== TEMP_USER || claims.role !== "authenticated" || !tokenIsLive(claims)) {
    throw new Error("Temporary signed identity or lifetime mismatch");
  }
  const checkpoint = async (stage, phase) => {
    if (await ops.snapshot(stage, phase) !== true) throw new Error("Independent baseline not confirmed");
  };
  await checkpoint("before_signin", "absent");
  if (!(await ops.authUser(frozenToken))) throw new Error("Signed identity not confirmed");
  const baselineMembership = await ops.membership(frozenToken);
  if (!Array.isArray(baselineMembership) || baselineMembership.length !== 0) {
    throw new Error("Temporary Admin membership already present");
  }
  if (await ops.objectHash(fixtures.image.path) !== fixtures.image.sha256) throw new Error("WebP mismatch");
  ops.onSigned?.();

  await ops.beforeActive(); // Owner-approved trusted Preview provisioning is external.
  await checkpoint("after_active", "active");
  if (!expectMembership(await ops.membership(frozenToken), true)) throw new Error("Active own membership not confirmed");
  if (!tokenIsLive(claims)) throw new Error("Frozen JWT expired before positive reads");
  const product = await ops.read(frozenToken, "products", fixtures.product.id);
  const order = await ops.read(frozenToken, "order_requests", fixtures.order.id);
  const storage = await ops.storageList(frozenToken);
  if (!expectRows(product, 1) || product.rows[0].id !== fixtures.product.id ||
    product.rows[0].catalog_kind !== "TEST_ONLY" || product.rows[0].is_published !== false ||
    !expectRows(order, 1) || order.rows[0].id !== fixtures.order.id ||
    !expectRows(storage, 1) || ![fixtures.image.path, fixtures.image.path.split("/").at(-1)]
      .includes(storage.rows[0].name)) {
    throw new Error("Signed active Admin exact resource visibility not confirmed");
  }
  ops.record("active_admin_reads", "PASS");
  await checkpoint("after_active_reads", "active");
  const browser = await ops.adminBrowser();
  if (!browser?.headersPass || !browser?.signedMarkerPresent || !browser?.anonymousMarkerAbsent ||
    !browser?.publicChunksComplete) throw new Error("Authenticated privacy or traffic check incomplete");
  ops.record("authenticated_privacy", "PASS");
  ops.record("synthetic_marker_isolation", "PASS");
  await checkpoint("after_privacy", "active");

  for (const mode of ["wrong", "missing"]) {
    if (!tokenIsLive(claims)) throw new Error("Frozen JWT expired before CSRF phase");
    await checkpoint(`before_csrf_${mode}`, "active");
    await ops.beforeCsrf(mode); // Separate Owner approval for each single attempt.
    let result;
    try { result = await ops.csrf(mode); }
    catch {
      // The request may have reached the server. Require a fresh independent
      // exact-row/REAL snapshot even when HTTP timed out; never retry it.
      await checkpoint(`after_csrf_${mode}_unknown`, "active");
      throw new Error("CSRF outcome unknown; no retry");
    }
    await checkpoint(`after_csrf_${mode}`, "active");
    if (![400, 401, 403].includes(result.status) && result.redirectToLogin !== true) {
      throw new Error("CSRF rejection not demonstrated");
    }
    ops.record(`csrf_${mode}`, "PASS", result.status);
  }

  if (!tokenIsLive(claims)) throw new Error("Frozen JWT expired before revocation checkpoint");
  await ops.beforeRevoke(); // Owner-approved trusted Preview deactivation is external.
  await checkpoint("after_revoked", "revoked");
  if (!tokenIsLive(claims) || !(await ops.authUser(frozenToken))) {
    throw new Error("Same frozen JWT is no longer valid; revocation UNVERIFIED");
  }
  const revokedMembership = await ops.membership(frozenToken);
  if (!Array.isArray(revokedMembership) ||
    (revokedMembership.length !== 0 && !expectMembership(revokedMembership, false))) {
    throw new Error("Revoked own membership state unclear");
  }
  const deniedProduct = await ops.read(frozenToken, "products", fixtures.product.id);
  const deniedOrder = await ops.read(frozenToken, "order_requests", fixtures.order.id);
  const deniedStorage = await ops.storageList(frozenToken);
  const denied = [deniedProduct, deniedOrder, deniedStorage].every((response) =>
    [401, 403].includes(response?.status) || expectRows(response, 0));
  if (!denied) throw new Error("Revoked direct resource access remains");
  ops.record("revoked_direct_reads", "PASS");
  if (!(await ops.revokedRoute())) throw new Error("Revoked Admin route not denied");
  ops.record("revoked_route", "PASS");
  await checkpoint("final", "revoked");
  if (await ops.objectHash(fixtures.image.path) !== fixtures.image.sha256) throw new Error("WebP changed");
  return true;
}

export const P0_EXPECTED_COUNTS = PHASE_COUNTS;
export const P0_PREVIEW = PREVIEW;

import { PREVIEW, parseJwtClaims, safeResult, tokenIsLive, validateFixtures } from "./t070-signed-qa-core.mjs";
import { RESUME_EXPECTED_COUNTS, validateResumeFixtures, validateResumeSnapshot } from "./t070-storage-resume.mjs";

const TEMP_USER = "ea39d2af-f164-4b2c-a496-502f2464d9af";
const PHASE_COUNTS = Object.freeze({
  absent: RESUME_EXPECTED_COUNTS,
  active: Object.freeze(RESUME_EXPECTED_COUNTS.map((n, i) => i === 8 ? 2 : i === 9 ? 1 : n)),
  inactive: Object.freeze(RESUME_EXPECTED_COUNTS.map((n, i) => i === 9 ? 1 : n)),
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
  return expectRows(value, 1) && value.rows[0].user_id === TEMP_USER && value.rows[0].is_active === active;
}

class P0StepError extends Error {
  constructor(result) {
    super("T070 P0 step stopped safely");
    this.result = result;
  }
}

function stopStep(name, reason, details = {}) {
  throw new P0StepError(safeResult(name, { status: "UNVERIFIED", reason }, details));
}

export function p0FailureResult(error) {
  // Only internally constructed allowlisted data can reach logs/reports.
  // Never serialize an exception message, response body, token or header.
  return error instanceof P0StepError ? error.result :
    safeResult("p0_preflight", { status: "UNVERIFIED", reason: "preflight_failed" });
}

async function observed(name, action) {
  try { return await action(); }
  catch (error) {
    if (error instanceof P0StepError) throw error;
    stopStep(name, ["TimeoutError", "AbortError"].includes(error?.name) ?
      "preflight_timeout" : "network_failure");
  }
}

function requireRead(name, response, valid) {
  if (valid) return;
  const details = {};
  if (Number.isInteger(response?.status) && response.status >= 100 && response.status <= 599) {
    details.httpStatus = response.status;
  }
  if (Array.isArray(response?.rows)) details.affectedRows = response.rows.length;
  stopStep(name, [401, 403].includes(response?.status) ? "auth_not_confirmed" : "unexpected_response", details);
}

// All operations are injected to allow a network-free self-test. This finite
// path has no PATCH, upload, DELETE or fixture cleanup operation.
export const P0_LIFETIME_BUDGET = Object.freeze({
  activation: 1800, active: 900, wrong: 900, missing: 600, revoke: 300, revoked: 90,
});

export function validateResumeIdentity(claims, userId) {
  if (claims.sub !== TEMP_USER || userId !== TEMP_USER || claims.role !== "authenticated" ||
    claims.iss !== `${PREVIEW.supabaseOrigin}/auth/v1` ||
    !(claims.aud === "authenticated" ||
      (Array.isArray(claims.aud) && claims.aud.length === 1 && claims.aud[0] === "authenticated"))) {
    stopStep("p0_signed_identity", "auth_not_confirmed");
  }
  return true;
}

export async function runResumeFinalP0(input) {
  return runFinalP0({ ...input, resume: true });
}

export async function runFinalP0({ fixtures, token, userId, ops, resume = false }) {
  validateFixtures(fixtures);
  validateResumeFixtures(fixtures);
  const frozenToken = token;
  const claims = parseJwtClaims(frozenToken);
  if (claims.sub !== TEMP_USER || userId !== TEMP_USER || claims.role !== "authenticated" || !tokenIsLive(claims)) {
    throw new Error("Temporary signed identity or lifetime mismatch");
  }
  if (resume) validateResumeIdentity(claims, userId);
  let recoveryRequired = false;
  const now = () => ops.now?.() ?? Date.now();
  const budget = (name, seconds) => {
    if (!resume) return;
    const remaining = Math.max(0, Math.floor(claims.exp - now() / 1000));
    const details = { remainingSeconds: Math.min(remaining, 9999), requiredSeconds: seconds,
      tokenLive: remaining > 0, recoveryRequired };
    if (remaining <= seconds) stopStep(name, remaining === 0 ? "expired_token" : "insufficient_lifetime", details);
    ops.recordResult?.(safeResult(name, { status: "PASS" }, details));
  };
  const recordRead = (name, response) => {
    if (resume) ops.record(name, "PASS", response.status);
  };
  try {
    const checkpoint = async (stage, phase) => {
      try {
        if (await ops.snapshot(stage, phase) !== true) stopStep(`p0_${stage}`, "preflight_failed");
      } catch (error) {
        if (error instanceof P0StepError) throw error;
        stopStep(`p0_${stage}`, "preflight_failed");
      }
    };
    await checkpoint("before_signin", resume ? "inactive" : "absent");
    if (resume) {
      const auth = await observed("p0_initial_auth", () => ops.authUserResponse(frozenToken));
      requireRead("p0_initial_auth", auth, auth?.status === 200 && auth.valid === true);
      recordRead("p0_initial_auth", auth);
    } else if (!(await ops.authUser(frozenToken))) throw new Error("Signed identity not confirmed");
    const baselineMembership = await observed("p0_initial_membership", () => ops.membership(frozenToken));
    requireRead("p0_initial_membership", baselineMembership,
      resume ? expectMembership(baselineMembership, false) : expectRows(baselineMembership, 0));
    recordRead("p0_initial_membership", baselineMembership);
    if (await ops.objectHash(fixtures.image.path) !== fixtures.image.sha256) throw new Error("WebP mismatch");
    ops.onSigned?.();

    if (!tokenIsLive(claims)) stopStep("p0_before_activation", "expired_token", { tokenLive: false });
    budget("p0_before_activation", P0_LIFETIME_BUDGET.activation);
    recoveryRequired = resume;
    await ops.beforeActive(() => budget("p0_activation_approved", P0_LIFETIME_BUDGET.activation)); // Owner-approved trusted Preview provisioning is external.
    await checkpoint("after_active", "active");
    // Manual checkpoints may outlast the original JWT. Stop BEFORE making
    // the membership request; never refresh or silently replace that token.
    if (!tokenIsLive(claims)) stopStep("p0_active_token", "expired_token", { tokenLive: false });
    budget("p0_active_budget", P0_LIFETIME_BUDGET.active);
    const membership = await observed("p0_active_membership", () => ops.membership(frozenToken));
    requireRead("p0_active_membership", membership, expectMembership(membership, true));
    recordRead("p0_active_membership", membership);
    const product = await observed("p0_active_product", () => ops.read(frozenToken, "products", fixtures.product.id));
    requireRead("p0_active_product", product, expectRows(product, 1) && product.rows[0].id === fixtures.product.id &&
      product.rows[0].catalog_kind === "TEST_ONLY" && product.rows[0].is_published === false);
    recordRead("p0_active_product", product);
    const order = await observed("p0_active_order", () => ops.read(frozenToken, "order_requests", fixtures.order.id));
    requireRead("p0_active_order", order, expectRows(order, 1) && order.rows[0].id === fixtures.order.id);
    recordRead("p0_active_order", order);
    const storage = await observed("p0_active_storage", () => ops.storageList(frozenToken));
    requireRead("p0_active_storage", storage, expectRows(storage, 1) &&
      [fixtures.image.path, fixtures.image.path.split("/").at(-1)].includes(storage.rows[0].name));
    recordRead("p0_active_storage", storage);
    ops.record("active_admin_reads", "PASS");
    await checkpoint("after_active_reads", "active");
    const browser = await observed("p0_authenticated_privacy", () => ops.adminBrowser());
    if (!browser?.headersPass || !browser?.signedMarkerPresent || !browser?.anonymousMarkerAbsent ||
      !browser?.publicChunksComplete) stopStep("p0_authenticated_privacy", "unexpected_response");
    ops.record("authenticated_privacy", "PASS");
    ops.record("synthetic_marker_isolation", "PASS");
    await checkpoint("after_privacy", "active");

    for (const mode of ["wrong", "missing"]) {
      if (!tokenIsLive(claims)) stopStep(`p0_csrf_${mode}_token`, "expired_token", { tokenLive: false });
      await checkpoint(`before_csrf_${mode}`, "active");
      budget(`p0_csrf_${mode}_budget`, P0_LIFETIME_BUDGET[mode]);
      await ops.beforeCsrf(mode); // Separate Owner approval for each single attempt.
      budget(`p0_csrf_${mode}_approved`, P0_LIFETIME_BUDGET[mode]);
      let result;
      try { result = await ops.csrf(mode); }
      catch {
        // The request may have reached the server. Require a fresh independent
        // exact-row/REAL snapshot even when HTTP timed out; never retry it.
        await checkpoint(`after_csrf_${mode}_unknown`, "active");
        stopStep(`p0_csrf_${mode}`, "outcome_unknown");
      }
      await checkpoint(`after_csrf_${mode}`, "active");
      if (![400, 401, 403].includes(result.status) && result.redirectToLogin !== true) {
        stopStep(`p0_csrf_${mode}`, "unexpected_response", { httpStatus: result.status });
      }
      ops.record(`csrf_${mode}`, "PASS", result.status);
    }

    if (!tokenIsLive(claims)) stopStep("p0_before_revocation", "expired_token", { tokenLive: false });
    budget("p0_before_revocation", P0_LIFETIME_BUDGET.revoke);
    await ops.beforeRevoke(() => budget("p0_revocation_approved", P0_LIFETIME_BUDGET.revoke)); // Owner-approved trusted Preview deactivation is external.
    await checkpoint("after_revoked", "revoked");
    recoveryRequired = false; // Trusted checkpoint already confirmed inactive membership.
    budget("p0_revoked_budget", P0_LIFETIME_BUDGET.revoked);
    if (!tokenIsLive(claims)) stopStep("p0_revoked_token", "expired_token", { tokenLive: false });
    if (resume) {
      const auth = await observed("p0_revoked_auth", () => ops.authUserResponse(frozenToken));
      requireRead("p0_revoked_auth", auth, auth?.status === 200 && auth.valid === true);
      ops.recordResult?.(safeResult("p0_revoked_auth", { status: "PASS" }, { httpStatus: auth.status, tokenLive: true }));
    } else if (!(await observed("p0_revoked_auth", () => ops.authUser(frozenToken)))) {
      stopStep("p0_revoked_auth", "auth_not_confirmed");
    }
    const revokedMembership = await observed("p0_revoked_membership", () => ops.membership(frozenToken));
    requireRead("p0_revoked_membership", revokedMembership,
      resume ? expectMembership(revokedMembership, false) :
        expectRows(revokedMembership, 0) || expectMembership(revokedMembership, false));
    recordRead("p0_revoked_membership", revokedMembership);
    for (const [name, read] of [
      ["p0_revoked_product", () => ops.read(frozenToken, "products", fixtures.product.id)],
      ["p0_revoked_order", () => ops.read(frozenToken, "order_requests", fixtures.order.id)],
      ["p0_revoked_storage", () => ops.storageList(frozenToken)],
    ]) {
      budget(`${name}_budget`, P0_LIFETIME_BUDGET.revoked);
      const response = await observed(name, read);
      if (resume && response?.status === 200 && Array.isArray(response.rows) && response.rows.length > 0) {
        throw new P0StepError(safeResult(name, { status: "FAIL", reason: "unexpected_response" },
          { httpStatus: response.status, affectedRows: response.rows.length }));
      }
      requireRead(name, response, [401, 403].includes(response?.status) || expectRows(response, 0));
      recordRead(name, response);
    }
    ops.record("revoked_direct_reads", "PASS");
    if (!(await observed("p0_revoked_route", () => ops.revokedRoute()))) stopStep("p0_revoked_route", "unexpected_response");
    ops.record("revoked_route", "PASS");
    await checkpoint("final", "revoked");
    if (await ops.objectHash(fixtures.image.path) !== fixtures.image.sha256) throw new Error("WebP changed");
    return true;
  } catch (error) {
    if (!resume) throw error;
    const result = p0FailureResult(error);
    throw new P0StepError(safeResult(result.name, { status: result.status, reason: result.reason },
      { ...Object.fromEntries(Object.entries(result).filter(([key]) => !["name", "status", "reason"].includes(key))),
        recoveryRequired }));
  }
}

export const P0_EXPECTED_COUNTS = PHASE_COUNTS;
export const P0_PREVIEW = PREVIEW;

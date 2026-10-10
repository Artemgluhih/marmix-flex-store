import assert from "node:assert/strict";

export const PREVIEW = Object.freeze({
  origin: "https://marmix-flex-redesign-v2-preview-efx5iy5ej.vercel.app",
  deploymentSha: "f0a5522e766a7f203b75d50c0862c2619278161a",
  branch: "t070-preview-review",
  projectRef: "twuevnwxwqdjbjzwuglm",
  supabaseOrigin: "https://twuevnwxwqdjbjzwuglm.supabase.co",
  bucket: "product-media",
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{32,64}$/;
const STATES = new Set(["PASS", "FAIL", "UNVERIFIED", "BLOCKED"]);
const REASONS = new Set([
  "not_executed", "missing_fixture", "missing_independent_check", "unexpected_response",
  "network_failure", "expired_token", "auth_not_confirmed", "target_not_present",
  "origin_not_proven", "action_not_captured", "owner_step_pending", "timeout_unknown",
  "unsafe_target", "private_cache", "anonymous_marker", "login_unavailable",
  "browser_unavailable",
]);

export function exactOrigin(value, expected) {
  if (typeof value !== "string") throw new Error("Preview origin mismatch");
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error("Preview origin mismatch"); }
  if (parsed.href !== expected + "/" || parsed.protocol !== "https:" || parsed.username ||
    parsed.password || parsed.port || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Preview origin mismatch");
  }
  return expected;
}

export function assertReview({ branch, head, expectedHead, origin, deploymentSha, projectRef }) {
  assert.equal(branch, PREVIEW.branch, "Review branch mismatch");
  assert.match(expectedHead ?? "", SHA, "Expected review SHA is required");
  assert.equal(head, expectedHead, "Local review HEAD mismatch");
  exactOrigin(origin, PREVIEW.origin);
  assert.equal(deploymentSha, PREVIEW.deploymentSha, "Deployment SHA mismatch");
  assert.equal(projectRef, PREVIEW.projectRef, "Supabase Preview project mismatch");
  return true;
}

export function validateAuthFixture(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Fixture manifest missing");
  assert.equal(input.projectRef, PREVIEW.projectRef);
  assert.equal(input.origin, PREVIEW.origin);
  assert.equal(input.deploymentSha, PREVIEW.deploymentSha);
  assert.match(input.userId ?? "", UUID);
  assert.match(input.userEmail ?? "", /^t070-[a-z0-9-]{6,64}@example\.invalid$/);
  assert.equal(input.approval, "OWNER_APPROVED_T070_SIGNED_EXECUTION");
  return Object.freeze(input);
}

export function validateFixtures(input) {
  validateAuthFixture(input);
  assert.match(input.product?.id ?? "", UUID);
  assert.match(input.order?.id ?? "", UUID);
  assert.match(input.image?.id ?? "", UUID);
  assert.match(input.image?.path ?? "",
    new RegExp(`^products/${input.product.id}/[0-9a-f-]{36}\\.webp$`, "i"));
  const filename = input.image.path.split("/").at(-1).slice(0, -5);
  assert.match(filename, UUID);
  assert.equal(input.product.catalogKind, "TEST_ONLY");
  assert.equal(input.product.isPublished, false);
  assert.match(input.product.sku ?? "", /^TEST_ONLY-T070-[A-Z0-9-]+$/);
  assert.match(input.product.slug ?? "", /^t070-[a-z0-9-]+$/);
  assert.match(input.product.baselineDigest ?? "", DIGEST);
  assert.match(input.image.sha256 ?? "", /^[0-9a-f]{64}$/);
  assert.match(input.image.metadataDigest ?? "", DIGEST);
  assert.match(input.order.marker ?? "", /^T070_QA_[A-Z0-9_-]{8,64}$/);
  return Object.freeze(input);
}

export function parseJwtClaims(token) {
  if (typeof token !== "string" || token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    throw new Error("Invalid access token");
  }
  let claims;
  try { claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")); }
  catch { throw new Error("Invalid access token"); }
  if (!UUID.test(claims.sub ?? "") || !Number.isSafeInteger(claims.exp)) throw new Error("Invalid access token");
  return { sub: claims.sub, exp: claims.exp };
}

export function tokenIsLive(claims, now = Date.now(), marginSeconds = 90) {
  return claims.exp * 1000 > now + marginSeconds * 1000;
}

export function classifyRowDenial({ targetPresentBefore, status, affectedRows, digestBefore, digestAfter }) {
  if (targetPresentBefore !== true) return { status: "UNVERIFIED", reason: "target_not_present" };
  if (digestAfter == null || digestBefore == null) return { status: "UNVERIFIED", reason: "missing_independent_check" };
  if (digestBefore !== digestAfter || affectedRows > 0) return { status: "FAIL", reason: "unexpected_response" };
  if (![200, 204, 401, 403].includes(status) ||
    !Number.isInteger(affectedRows) || affectedRows !== 0) {
    return { status: "UNVERIFIED", reason: "unexpected_response" };
  }
  return { status: "PASS", reason: null };
}

export function classifyStorageDenial({ targetPresentBefore, targetPresentAfter, hashBefore, hashAfter,
  affectedObjects, status, independentMetadataUnchanged }) {
  if (targetPresentBefore !== true) return { status: "UNVERIFIED", reason: "target_not_present" };
  if (targetPresentAfter === false) return { status: "FAIL", reason: "unexpected_response" };
  if (targetPresentAfter == null || hashAfter == null) return { status: "UNVERIFIED", reason: "missing_independent_check" };
  if (!targetPresentAfter || hashBefore !== hashAfter || affectedObjects > 0) return { status: "FAIL", reason: "unexpected_response" };
  if (independentMetadataUnchanged == null) return { status: "UNVERIFIED", reason: "missing_independent_check" };
  if (!independentMetadataUnchanged) return { status: "FAIL", reason: "unexpected_response" };
  if (![200, 204, 401, 403].includes(status)) return { status: "UNVERIFIED", reason: "unexpected_response" };
  return { status: "PASS", reason: null };
}

export function classifyRevocation({ sameToken, authStatus, live, denied, unchanged }) {
  if (!sameToken || !live) return { status: "UNVERIFIED", reason: "expired_token" };
  if (authStatus !== 200) return { status: "UNVERIFIED", reason: "auth_not_confirmed" };
  if (unchanged !== true) return { status: unchanged === false ? "FAIL" : "UNVERIFIED",
    reason: unchanged === false ? "unexpected_response" : "missing_independent_check" };
  return denied ? { status: "PASS", reason: null } : { status: "FAIL", reason: "unexpected_response" };
}

export function csrfRequestFromRenderedForm({ fields, actionUrl, productId }, originMode) {
  if (!UUID.test(productId ?? "") || !Array.isArray(fields)) throw new Error("No approved rendered action");
  const url = new URL(actionUrl);
  if (url.origin !== PREVIEW.origin || url.pathname !== `/admin/products/${productId}` || url.search || url.hash) {
    throw new Error("Action target outside exact product editor");
  }
  const actions = fields.filter(([name]) => /^\$ACTION_(?:ID|REF)_[A-Za-z0-9_]+$/.test(name));
  if (actions.length !== 1 || fields.some(([name, value]) =>
    typeof name !== "string" || typeof value !== "string" || name.length > 100 || value.length > 5000)) {
    throw new Error("Action reference not captured from rendered form");
  }
  if (!["wrong", "missing"].includes(originMode)) throw new Error("Unsupported Origin probe");
  const multipart = new FormData();
  for (const [name, value] of fields) multipart.append(name, value);
  return {
    url: url.href,
    multipart,
    headers: originMode === "wrong" ? { Origin: "https://t070-invalid-origin.invalid" } : {},
    maxRedirects: 0,
  };
}

export function safeHeader(value, kind) {
  if (value == null) return null;
  const allowed = kind === "cache"
    ? /^(?:public|private|no-store|no-cache|must-revalidate|(?:max-age|s-maxage)=\d+)$/
    : /^(?:noindex|nofollow|none|all|index|follow)$/;
  return String(value).toLowerCase().split(",").map((part) => {
    const directive = part.trim();
    return allowed.test(directive) ? directive : "[omitted]";
  }).join(", ");
}

export function privateCache(value) {
  return /(?:^|[, ])(?:private|no-store)(?:[, ]|$)/i.test(value ?? "") &&
    !/(?:^|[, ])(?:public|s-maxage\s*=)/i.test(value ?? "");
}

export function safeResult(name, verdict, details = {}) {
  if (!/^[a-z_]{3,50}$/.test(name) || !STATES.has(verdict.status)) throw new Error("Unsafe verdict");
  if (verdict.reason != null && !REASONS.has(verdict.reason)) throw new Error("Unsafe reason");
  const allowed = {};
  for (const [key, value] of Object.entries(details)) {
    if (!["httpStatus", "affectedRows", "affectedObjects", "responsesScanned", "unchanged", "cacheControl", "xRobotsTag",
      "robotsMeta", "markerAbsent", "tokenLive"].includes(key)) throw new Error("Unsafe report field");
    if (["httpStatus", "affectedRows", "affectedObjects", "responsesScanned"].includes(key)) {
      if (!Number.isInteger(value) || value < 0 || value > 9999) throw new Error("Unsafe count");
    } else if (["unchanged", "markerAbsent", "tokenLive"].includes(key)) {
      if (typeof value !== "boolean") throw new Error("Unsafe boolean");
    } else if (value !== null && typeof value !== "string") throw new Error("Unsafe header");
    allowed[key] = key === "cacheControl" ? safeHeader(value, "cache") :
      key === "xRobotsTag" || key === "robotsMeta" ? safeHeader(value, "robots") : value;
  }
  return { name, status: verdict.status, reason: verdict.reason ?? null, ...allowed };
}

export function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === "--self-test") return { mode: "self-test" };
  if (argv.length === 1 && argv[0] === "--help") return { mode: "help" };
  if (argv.length === 3 && ["--dry-run", "--execute", "--observe-expiry"].includes(argv[0]) &&
    argv[1] === "--review-sha" && SHA.test(argv[2])) {
    return { mode: argv[0].slice(2), reviewSha: argv[2] };
  }
  throw new Error("Use --self-test, --dry-run/--execute/--observe-expiry --review-sha <40-hex SHA>");
}

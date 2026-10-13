import { randomUUID } from "node:crypto";
import { classifyStorageDenial, parseJwtClaims, tokenIsLive, validateFixtures } from "./t070-signed-qa-core.mjs";

const PRODUCT_ID = "19bbe932-ee48-4306-b7f1-d615a5a64a34";
const USER_ID = "ea39d2af-f164-4b2c-a496-502f2464d9af";
const IMAGE_ID = "2beefa3e-503d-4118-993a-920268f4d07d";
const ORDER_ID = "a8b701e4-7a1c-4f0c-8583-4195ed819278";
const IMAGE_PATH = `products/${PRODUCT_ID}/1a01d658-cec9-463a-be9d-53f8a9dd2434.webp`;
const ORDER_DIGEST = "cf2f1bbedddcb1d5121f82967c268362";
const OWNER_ADMIN_DIGEST = "e25b0acc05a0dc20ae0e8d6a81b714ce";
const REAL_DIGESTS = Object.freeze([
  "326c9f26f1bac9b1a5e0ea57dcec26d2", "00828af0700e500b1b3dfca3533b4ffd",
  "2d6e9be52c0b648db4852d0c9e886347", "ea75c4e62cbc5ea6a4393a28e13d4511",
  "4db06d1d57bf9df40717512a5de04a7b", "a0b5bc890eaf664b1589de37bbf75934",
  "57aa59930bdd8f8cb943698c831d0346", "57aa59930bdd8f8cb943698c831d0346",
  "c74295f9f74036461ec83c5e43a7387e", "23459cec4d862dc680a129742d59ebe0",
]);
const COUNTS = Object.freeze([4, 1, 3, 3, 4, 4, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1]);

export function validateResumeFixtures(input) {
  const fixtures = validateFixtures(input);
  if (fixtures.userId !== USER_ID || fixtures.product.id !== PRODUCT_ID ||
    fixtures.product.sku !== "TEST_ONLY-T070-19BBE932" ||
    fixtures.product.slug !== "t070-qa-product-20261009" ||
    fixtures.product.baselineDigest !== "5aeff7a1c58c7eea983d018e7818b31c" ||
    fixtures.image.id !== IMAGE_ID || fixtures.image.path !== IMAGE_PATH ||
    fixtures.image.sha256 !== "5671091f2ffe373f834f309b1c0947ff4f89e8d5b18ed4be9f57adad3560c80e" ||
    fixtures.image.metadataDigest !== "7a8d0021adff60af6c07bd6d00e68cc4" ||
    fixtures.order.id !== ORDER_ID || fixtures.order.marker !== "T070_QA_SIGNED_20261011") {
    throw new Error("Storage resume fixture mismatch");
  }
  return fixtures;
}

export function validateResumeSnapshot(counts, digests, fixtures) {
  validateResumeFixtures(fixtures);
  const countValues = counts.split(",").map((value) => value.trim());
  const digestValues = digests.split(",").map((value) => value.trim());
  const expectedDigests = [fixtures.product.baselineDigest, fixtures.image.metadataDigest,
    ORDER_DIGEST, ...REAL_DIGESTS, OWNER_ADMIN_DIGEST];
  if (countValues.length !== COUNTS.length ||
    countValues.some((value, i) => !/^(0|[1-9]\d*)$/.test(value) || Number(value) !== COUNTS[i]) ||
    digestValues.length !== expectedDigests.length ||
    digestValues.some((value, i) => !/^[0-9a-f]{32}$/.test(value) || value !== expectedDigests[i])) {
    throw new Error("Trusted Preview baseline mismatch");
  }
  return true;
}

function stop(reason, stage = "preflight", securityViolation = false) {
  const error = new Error(reason);
  error.storageStage = stage;
  error.securityViolation = securityViolation;
  throw error;
}

async function checked(stage, action) {
  try { return await action(); }
  catch (error) {
    if (error && typeof error === "object" && !error.storageStage) error.storageStage = stage;
    throw error;
  }
}

// Only the bounded Storage operations below exist in this phase. The full
// --execute path (PATCH, ACTIVE, CSRF, REVOKED) is never called by this mode.
export async function runStorageOnly({ fixtures, token, userId, ops }) {
  validateResumeFixtures(fixtures);
  const claims = parseJwtClaims(token);
  if (claims.sub !== USER_ID || userId !== USER_ID || !tokenIsLive(claims)) stop("Temporary Auth identity mismatch");
  if (!(await checked("preflight", () => ops.authUser()))) stop("Signed Auth user not confirmed");
  const membership = await checked("preflight", () => ops.ownMembership());
  if (!Array.isArray(membership) || membership.length !== 0) stop("Temporary Admin membership is present");
  ops.onSigned?.();
  await checked("preflight", () => ops.trustedSnapshot("before_upload"));
  if (await checked("preflight", () => ops.objectHash(IMAGE_PATH)) !== fixtures.image.sha256) {
    stop("Existing WebP mismatch");
  }

  const uploadPath = `products/${PRODUCT_ID}/${randomUUID()}.webp`;
  if (await checked("preflight", () => ops.objectHash(uploadPath)) !== null) stop("Upload path collision");
  await checked("preflight", () => ops.beforeUpload(uploadPath));
  if (!tokenIsLive(claims)) stop("Frozen JWT expired before upload");
  let upload;
  try { upload = await ops.upload(uploadPath); }
  catch { stop("Upload outcome unknown; exact path inspection required, no retry", "mutation"); }
  let uploadHash;
  try { uploadHash = await ops.objectHash(uploadPath); }
  catch { stop("Upload verification unavailable; exact path inspection required, no retry", "mutation"); }
  if (uploadHash !== null) stop("Denied upload created an object", "mutation", true);
  await checked("mutation", () => ops.afterUpload(uploadPath));
  if (![401, 403].includes(upload.status)) stop("Upload denial not confirmed", "mutation");

  if (await checked("preflight", () => ops.objectHash(IMAGE_PATH)) !== fixtures.image.sha256) {
    stop("Existing WebP changed before delete");
  }
  await checked("preflight", () => ops.beforeDelete(IMAGE_PATH));
  if (!tokenIsLive(claims)) stop("Frozen JWT expired before delete");
  let deletion;
  try { deletion = await ops.delete(IMAGE_PATH); }
  catch { stop("Delete outcome unknown; exact path inspection required, no retry", "mutation"); }
  let after;
  try { after = await ops.objectHash(IMAGE_PATH); }
  catch { stop("Delete verification unavailable; exact path inspection required, no retry", "mutation"); }
  if (after !== fixtures.image.sha256) stop("Denied delete changed the fixture", "mutation", true);
  await checked("mutation", () => ops.afterDelete(IMAGE_PATH));
  const verdict = classifyStorageDenial({ targetPresentBefore: true, targetPresentAfter: true,
    hashBefore: fixtures.image.sha256, hashAfter: after, affectedObjects: 0,
    status: deletion.status, independentMetadataUnchanged: true });
  if (verdict.status !== "PASS") stop("Delete denial not confirmed", "mutation");
  return { uploadStatus: upload.status, deleteStatus: deletion.status };
}

// A separate continuation after the Owner's independently verified denied
// upload. This path never generates an upload key or calls an upload/PATCH op.
export async function runStorageDeleteOnly({ fixtures, token, userId, ops }) {
  validateResumeFixtures(fixtures);
  const claims = parseJwtClaims(token);
  if (claims.sub !== USER_ID || userId !== USER_ID || claims.role !== "authenticated" ||
    !tokenIsLive(claims)) stop("Temporary signed Auth identity mismatch");
  if (!(await checked("preflight", () => ops.authUser()))) stop("Signed Auth user not confirmed");
  const membership = await checked("preflight", () => ops.ownMembership());
  if (!Array.isArray(membership) || membership.length !== 0) stop("Temporary Admin membership is present");
  ops.onSigned?.();
  await checked("preflight", () => ops.trustedSnapshot("before_delete"));
  if (await checked("preflight", () => ops.objectHash(IMAGE_PATH)) !== fixtures.image.sha256) {
    stop("Existing WebP mismatch");
  }
  await checked("preflight", () => ops.beforeDelete(IMAGE_PATH));
  if (!tokenIsLive(claims)) stop("Frozen JWT expired before delete");
  let deletion;
  try { deletion = await ops.delete(IMAGE_PATH); }
  catch { stop("Delete outcome unknown; exact path inspection required, no retry", "mutation"); }
  let after;
  try { after = await ops.objectHash(IMAGE_PATH); }
  catch { stop("Delete verification unavailable; exact path inspection required, no retry", "mutation"); }
  if (after !== fixtures.image.sha256) stop("Denied delete changed the fixture", "mutation", true);
  await checked("mutation", () => ops.afterDelete(IMAGE_PATH));
  // Legacy Storage can report a precise AccessDenied as HTTP 400. A generic
  // 400 is never accepted; the signed identity and independent object checks
  // above are also required.
  const acceptedStatus = deletion.status === 400 && deletion.accessDenied === true ? 403 : deletion.status;
  const verdict = classifyStorageDenial({ targetPresentBefore: true, targetPresentAfter: true,
    hashBefore: fixtures.image.sha256, hashAfter: after, affectedObjects: 0,
    status: acceptedStatus, independentMetadataUnchanged: true });
  if (verdict.status !== "PASS") stop("Delete denial not confirmed", "mutation");
  return { deleteStatus: deletion.status };
}

export const RESUME_EXPECTED_COUNTS = COUNTS;
export const RESUME_EXPECTED_REAL_DIGESTS = REAL_DIGESTS;


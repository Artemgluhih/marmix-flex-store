const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "../src");
function load(relative, mocks = {}) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => (name in mocks ? mocks[name] : require(name)), mod, mod.exports,
  );
  return mod.exports;
}

const { isSameOriginMutationRequest } = load("lib/admin/same-origin.ts");
const { adminReturnPath } = load("app/admin/login/return-path.ts");
const { validMediaPath, mediaPathFor, validateImageFile } =
  load("app/admin/(workspace)/products/[id]/media-validation.ts");
const userId = "00000000-0000-4000-8000-000000000001";
const productId = "00000000-0000-4000-8000-000000000002";
const sameOrigin = new Headers({
  origin: "https://preview.example.test",
  host: "preview.example.test",
  "x-forwarded-host": "preview.example.test",
  "x-forwarded-proto": "https",
});
function requestHeaders(changes) {
  const result = new Headers(sameOrigin);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) result.delete(key); else result.set(key, value);
  }
  return result;
}

for (const [label, headers, allowed] of [
  ["same origin", sameOrigin, true],
  ["missing Origin", requestHeaders({ origin: null }), false],
  ["foreign Origin", requestHeaders({ origin: "https://external.example.test" }), false],
  ["forwarded Host mismatch", requestHeaders({ "x-forwarded-host": "external.example.test" }), false],
  ["scheme mismatch", requestHeaders({ origin: "http://preview.example.test" }), false],
  ["Origin path", requestHeaders({ origin: "https://preview.example.test/path" }), false],
  ["non-HTTPS public host", requestHeaders({ "x-forwarded-proto": "http", origin: "http://preview.example.test" }), false],
]) assert.equal(isSameOriginMutationRequest(headers), allowed, label);

for (const value of [
  "https://external.example.test/admin", "//external.example.test", "/admin/../orders",
  "/admin/login", "/admin/orders?next=//external.example.test", "/catalog",
]) assert.equal(adminReturnPath(value), "/admin", value);
assert.equal(adminReturnPath("/admin/orders"), "/admin/orders");

let currentHeaders = sameOrigin;
let currentUser = { id: userId };
let membership = true;
let authCalls = 0;
let signouts = 0;
const client = {
  auth: {
    getUser: async () => { authCalls++; return { data: { user: currentUser }, error: null }; },
    signOut: async () => { signouts++; return { error: null }; },
  },
};
class Redirect extends Error { constructor(destination) { super(destination); this.destination = destination; } }
const guard = load("lib/admin/require-admin.ts", {
  "server-only": {},
  "next/cache": { unstable_noStore() {} },
  "next/headers": { headers: async () => currentHeaders },
  "next/navigation": { redirect: (destination) => { throw new Redirect(destination); } },
  "@/app/admin/login/return-path": { adminReturnPath },
  "@/lib/supabase/auth": { createAuthSupabaseClient: async () => client },
  "./membership": { hasActiveAdminMembership: async (_client, id) => membership && id === userId },
  "./same-origin": { isSameOriginMutationRequest },
});
async function denied(promise, destination) {
  await assert.rejects(promise, (error) => error instanceof Redirect && error.destination === destination);
}

(async () => {
  assert.equal((await guard.requireAdmin("/admin/orders")).userId, userId);
  assert.equal((await guard.requireAdminMutation()).supabase, client);
  currentHeaders = requestHeaders({ origin: "https://external.example.test" });
  const before = authCalls;
  await denied(guard.requireAdminMutation(), "/admin/login");
  assert.equal(authCalls, before, "cross-origin denial happens before Auth");
  currentHeaders = sameOrigin;
  currentUser = null;
  await denied(guard.requireAdmin("/admin/orders"), "/admin/login?next=%2Fadmin%2Forders");
  await denied(guard.requireAdminMutation(), "/admin/login");
  currentUser = { id: userId };
  membership = false;
  await denied(guard.requireAdmin("/admin/products"), "/admin/login?next=%2Fadmin%2Fproducts");
  await denied(guard.requireAdminMutation(), "/admin/login");
  assert.equal(signouts, 1, "revoked/non-admin mutation clears the local session");
  membership = true;
  assert.equal((await guard.requireAdminMutation()).userId, userId);

  const validPath = mediaPathFor(productId, "isolatedqa_12345", "webp");
  assert.equal(validMediaPath(productId, validPath), true);
  assert.equal(validMediaPath(userId, validPath), false, "wrong product prefix");
  assert.equal(validMediaPath(productId, validPath.replace("products/", "other/")), false);
  assert.equal(validMediaPath(productId, validPath.replace(".webp", ".svg")), false);
  assert.deepEqual(validateImageFile({ name: "test.webp", type: "image/webp", size: 100 }), { extension: "webp" });
  assert.ok("error" in validateImageFile({ name: "test.svg", type: "image/svg+xml", size: 100 }));
  assert.ok("error" in validateImageFile({ name: "test.webp", type: "image/webp", size: 13 * 1024 * 1024 }));

  const actions = [
    "products/new/actions.ts", "products/[id]/actions.ts", "products/[id]/media-actions.ts",
    "products/[id]/media-metadata-actions.ts", "products/[id]/media-removal-actions.ts",
    "products/[id]/assortment-actions.ts", "products/[id]/category-actions.ts",
    "products/order-actions.ts", "categories/actions.ts", "categories/order-actions.ts",
    "categories/delete-action.ts", "categories/publication-actions.ts", "orders/[id]/order-actions.ts",
  ];
  for (const relative of actions) {
    const source = fs.readFileSync(path.join(root, "app/admin/(workspace)", relative), "utf8");
    assert.match(source, /requireAdminMutation\(/, relative);
    assert.doesNotMatch(source, /createOrderSecretSupabaseClient|service_role/, relative);
  }
  console.log("T070 synthetic Admin guard, CSRF, redirect, media input and action boundary: PASS");
})().catch((error) => { console.error(error); process.exitCode = 1; });

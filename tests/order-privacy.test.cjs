const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "../src");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function loadPure(file) {
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const moduleRef = { exports: {} };
  new Function("require", "module", "exports", code)(require, moduleRef, moduleRef.exports);
  return moduleRef.exports;
}
const orderId = "d0590000-0000-4059-8059-000000000001";
const contact = { name: "TEST_ONLY name", phone: "+7 900 000-00-00", city: "TEST_ONLY city", email: "test@example.test", comment: "TEST_ONLY comment" };
const snapshot = [{ productId: "d0590000-0000-4059-8059-000000000003", sku: "TEST_ONLY-SKU", name: "TEST_ONLY product", quantity: 3, saleUnit: "sheet", priceMinor: 200000, priceUnit: "м²", lineTotalMinor: 2419680 }];
const request = { contact, items: [], idempotencyKey: "d0590000-0000-4059-8059-000000000002", internal_note: "TEST_ONLY internal note" };
const prepared = { contact, items: snapshot, totalMinor: 2419680, currency: "RUB", internal_note: "TEST_ONLY internal note" };

let outcome = "same";
let notificationCalls = 0;
const mocks = {
  "@/lib/orders/validate-request": { MAX_ORDER_BODY_BYTES: 100000, MAX_ORDER_ITEMS: 10, validateOrderRequest: () => outcome === "validation" ? { ok: false, fields: ["name"] } : { ok: true, value: request } },
  "@/lib/orders/idempotency": { lookupExistingOrder: async () => null, resolveIdempotency: () => outcome === "same" ? { status: "same", id: orderId } : outcome === "conflict" ? { status: "conflict" } : { status: "new", hash: "test" } },
  "@/lib/catalog/queries": { getOrderProductsFreshByIds: async () => [] },
  "@/lib/orders/prepare": { prepareOrder: () => outcome === "changed" ? { ok: false } : { ok: true, value: prepared } },
  "@/lib/orders/preview-gate": { previewOrderAllowed: () => true },
  "@/lib/orders/insert": { insertPreparedOrder: async () => outcome === "created" ? { status: "created", id: orderId, createdAt: "2026-10-05T00:00:00Z" } : { status: "replayed", id: orderId } },
  "@/lib/orders/notifications": { notifyCreatedOrder: async () => { notificationCalls++; } },
};
const code = ts.transpileModule(read("app/api/order-requests/route.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleRef = { exports: {} };
new Function("require", "module", "exports", code)((name) => mocks[name] ?? require(name), moduleRef, moduleRef.exports);

async function post() {
  const url = "https://preview.example.test/api/order-requests";
  const original = { VERCEL_URL: process.env.VERCEL_URL, VERCEL_ENV: process.env.VERCEL_ENV };
  process.env.VERCEL_URL = "preview.example.test";
  process.env.VERCEL_ENV = "preview";
  try {
    const response = await moduleRef.exports.POST(new Request(url, {
      method: "POST", headers: { origin: "https://preview.example.test", "content-type": "application/json" }, body: "{}",
    }));
    return { status: response.status, headers: response.headers, body: await response.json() };
  } finally {
    for (const key of Object.keys(original)) {
      if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key];
    }
  }
}
const safe = (body) => {
  const serialized = JSON.stringify(body);
  for (const privateValue of [...Object.values(contact), prepared.internal_note, snapshot[0].sku, snapshot[0].name]) {
    assert.equal(serialized.includes(privateValue), false, `private data leaked: ${privateValue}`);
  }
  assert.equal(/items_snapshot|request_hash|idempotency_key|internal_note|total_minor|notification/i.test(serialized), false);
};

(async () => {
  outcome = "same";
  let result = await post();
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { submitted: true, request_id: orderId, replayed: true });
  assert.equal(result.headers.get("cache-control"), "no-store");
  safe(result.body);
  outcome = "conflict";
  result = await post();
  assert.equal(result.status, 409);
  assert.equal(JSON.stringify(result.body).includes(orderId), false);
  safe(result.body);
  outcome = "changed";
  result = await post();
  assert.equal(result.status, 409);
  safe(result.body);
  outcome = "validation";
  result = await post();
  assert.equal(result.status, 400);
  safe(result.body);
  outcome = "replayed";
  result = await post();
  assert.deepEqual(result.body, { submitted: true, request_id: orderId, replayed: true });
  assert.equal(notificationCalls, 0);
  outcome = "created";
  result = await post();
  assert.equal(result.status, 201);
  assert.deepEqual(result.body, { submitted: true, request_id: orderId });
  assert.equal(notificationCalls, 1);
  safe(result.body);

  const list = read("app/admin/(workspace)/orders/page.tsx");
  const detail = read("app/admin/(workspace)/orders/[id]/page.tsx");
  const actions = read("app/admin/(workspace)/orders/[id]/order-actions.ts");
  const guard = read("lib/admin/require-admin.ts");
  const notify = read("lib/orders/notifications/format.ts") + read("lib/orders/notifications/index.ts");
  for (const source of [list, detail]) {
    assert.match(source, /requireAdmin\(/);
    assert.match(source, /force-dynamic/);
    assert.match(source, /force-no-store/);
    assert.match(source, /noStore\(\)/);
  }
  assert.match(actions, /requireAdminMutation\(\)/g);
  assert.match(guard, /auth\.getUser\(\)/);
  assert.match(guard, /hasActiveAdminMembership/);
  assert.doesNotMatch(list + detail + actions, /createOrderSecretSupabaseClient|localStorage|sessionStorage|console\./);
  assert.doesNotMatch(notify, /internal_note|request_hash|idempotency_key|console\./);
  assert.match(actions, /\.update\(\{ status: next \}\)/);
  assert.match(actions, /\.update\(\{ internal_note: note \}\)/);
  const { parseOrderListParams } = loadPure("app/admin/(workspace)/orders/orders-list.ts");
  assert.deepEqual(parseOrderListParams({ status: "in_progress", sort: "oldest", page: "2" }),
    { status: "in_progress", sort: "oldest", page: 2 });
  assert.deepEqual(parseOrderListParams({ status: "injected", sort: "other", page: "-1" }),
    { status: "", sort: "newest", page: 1 });
  const { validOrderId, parseOrderSnapshot } = loadPure("app/admin/(workspace)/orders/[id]/snapshot.ts");
  assert.equal(validOrderId(orderId), true);
  assert.equal(validOrderId("not-an-id"), false);
  assert.equal(parseOrderSnapshot([{
    product_id: snapshot[0].productId, sku: snapshot[0].sku, name: snapshot[0].name,
    quantity: 3, sale_unit: "sheet", price_minor: 200000, price_unit: "м²", line_total_minor: 2419680,
  }])[0].lineTotalMinor, 2419680);
  assert.equal(parseOrderSnapshot([{ name: "malformed" }]), null);
  console.log("T059 public response and Orders privacy boundary: PASS");
})().catch((error) => { console.error(error); process.exitCode = 1; });

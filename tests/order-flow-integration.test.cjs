const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const loaded = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (loaded.has(filename)) return loaded.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  loaded.set(filename, mod.exports);
  const localRequire = (name) => {
    if (name === "server-only") return {};
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith(".")) {
      const target = path.resolve(path.dirname(filename), name);
      return load(path.relative(root, fs.existsSync(target + ".ts") ? target + ".ts" : path.join(target, "index.ts")));
    }
    throw new Error(`Unexpected import: ${name}`);
  };
  new Function("require", "module", "exports", code)(localRequire, mod, mod.exports);
  loaded.set(filename, mod.exports);
  return mod.exports;
}

const { TECHNICAL_FLOW_PRODUCT: product, TECHNICAL_FLOW_KEYS: keys,
  TECHNICAL_FLOW_CONTACT: contact, technicalFlowAllowed } = load("src/lib/orders/technical-flow-fixture.ts");
const { evaluateCommerce, exactTotalMinor } = load("src/lib/catalog/commerce.ts");
const { currentSnapshot, reconcileLines } = load("src/lib/cart/reconcile.ts");
const { EMPTY_CART, upsertLine, updateQuantity, removeLine } = load("src/lib/cart/model.ts");
const { validateOrderRequest } = load("src/lib/orders/validate-request.ts");
const { prepareOrder } = load("src/lib/orders/prepare.ts");
const { validateForm } = load("src/app/(public)/checkout/form.ts");

const model = evaluateCommerce(product, true);
assert.equal(model.commercialStatus, "ready");
assert.equal(model.min, 1);
assert.equal(model.step, 2);
assert.equal(exactTotalMinor(model, 3), 2419680);
assert.equal(exactTotalMinor(model, 2), null);
const snapshot = currentSnapshot(product);
const first = upsertLine(EMPTY_CART, { productId: product.id, quantity: 3, snapshot }, model);
assert.equal(first.ok, true);
assert.equal(first.state.lines.length, 1);
const repeated = upsertLine(first.state, { productId: product.id, quantity: 3, snapshot }, model);
assert.equal(repeated.changed, false);
assert.equal(repeated.state, first.state);
assert.equal(reconcileLines(first.state.lines, [product]).totalMinor, 2419680);
const invalid = updateQuantity(first.state, product.id, 2, model);
assert.equal(invalid.ok, false);
assert.equal(invalid.state, first.state);
assert.equal(removeLine(first.state, product.id).state.lines.length, 0);
const staleLine = { ...first.state.lines[0], snapshot: { ...snapshot, priceMinor: 199999 } };
assert.equal(reconcileLines([staleLine], [product]).lines[0].status, "price_or_unit_changed");
assert.equal(reconcileLines([staleLine], [product]).totalMinor, null);
assert.equal(reconcileLines(first.state.lines, []).lines[0].status, "missing");
assert.equal(reconcileLines(first.state.lines, [{ ...product, availabilityStatus: null }]).lines[0].status, "unavailable");
assert.deepEqual(validateForm(contact), {});
assert.ok(validateForm({ ...contact, name: "" }).name);
assert.ok(validateForm({ ...contact, phone: "x" }).phone);

function payload(key, changes = {}) {
  return { version: 1, idempotency_key: key, ...contact,
    items: [{ product_id: product.id, quantity: 3, price_minor: product.priceMinor,
      price_unit: product.priceUnit, sale_unit: product.saleUnit, ...changes }] };
}
const parsed = validateOrderRequest(payload(keys.positive));
assert.equal(parsed.ok, true);
process.env.VERCEL_ENV = "preview";
process.env.VERCEL_GIT_COMMIT_REF = "t055-preview-review";
assert.equal(technicalFlowAllowed(parsed.value), true);
assert.equal(prepareOrder(parsed.value, [product], "a".repeat(64)).value.totalMinor, 2419680);
for (const [key, changes] of [
  [keys.changedPrice, { price_minor: 199999 }],
  [keys.changedUnit, { price_unit: "шт." }],
  [keys.invalidQuantity, { quantity: 2 }],
]) {
  const request = validateOrderRequest(payload(key, changes));
  assert.equal(request.ok, true);
  assert.equal(technicalFlowAllowed(request.value), true);
  assert.equal(prepareOrder(request.value, [product], "a".repeat(64)).ok, false);
}
assert.equal(prepareOrder(parsed.value, [], "a".repeat(64)).ok, false);
assert.equal(prepareOrder(parsed.value, [{ ...product, availabilityStatus: null }], "a".repeat(64)).ok, false);
process.env.VERCEL_ENV = "production";
assert.equal(technicalFlowAllowed(parsed.value), false);
process.env.VERCEL_ENV = "preview";
process.env.VERCEL_GIT_COMMIT_REF = "redesign-v2";
assert.equal(technicalFlowAllowed(parsed.value), false);
console.log("T055 isolated cart/form/order boundary: PASS");

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const mod = { exports: {} }; modules.set(file, mod.exports);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', js)((name) => {
    if (name.startsWith('@/')) return load(path.join('src', name.slice(2)) + '.ts');
    if (name.startsWith('.')) return load(path.join(path.dirname(file), name) + '.ts');
    throw Error(`Unexpected import: ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}

const { EMPTY_CART, upsertLine, updateQuantity, removeLine } = load('src/lib/cart/model.ts');
const { CART_STORAGE_KEY, decodeCart, readCart, writeCart } = load('src/lib/cart/storage.ts');
const { reconcileLines, currentSnapshot } = load('src/lib/cart/reconcile.ts');
const { evaluateCommerce } = load('src/lib/catalog/commerce.ts');
const product = {
  id: '11111111-1111-4111-8111-111111111111', name: 'TEST_ONLY in-memory panel',
  priceMinor: 200000, currency: 'RUB', priceUnit: 'м²', saleUnit: 'sheet',
  minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328,
  availabilityStatus: 'in_stock', primaryImage: null,
};
const rule = evaluateCommerce(product, true);
assert.equal(rule.commercialStatus, 'ready');
let state = upsertLine(EMPTY_CART, { productId: product.id, quantity: 1, snapshot: currentSnapshot(product) }, rule).state;
assert.equal(upsertLine(state, { productId: product.id, quantity: 1, snapshot: currentSnapshot(product) }, rule).changed, false);
state = updateQuantity(state, product.id, 3, rule).state;
assert.equal(reconcileLines(state.lines, [product]).totalMinor, 2419680);
const storage = new Map();
const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
assert.equal(writeCart(localStorage, state), true);
assert.equal(readCart(localStorage).recovery, 'none');
assert.equal(readCart(localStorage).state.lines[0].quantity, 3);
assert.ok(storage.has(CART_STORAGE_KEY));
assert.equal(decodeCart('{bad').recovery, 'storage_recovered');
assert.equal(decodeCart(JSON.stringify({ version: 99, lines: state.lines })).state.lines.length, 0);
assert.equal(decodeCart(JSON.stringify({ version: 1, lines: [state.lines[0], state.lines[0]] })).state.lines.length, 1);
assert.equal(readCart({ getItem: () => { throw Error('storage denied'); } }).recovery, 'storage_unavailable');
assert.equal(reconcileLines(state.lines, []).lines[0].status, 'missing');
assert.equal(reconcileLines(state.lines, [{ ...product, availabilityStatus: null }]).lines[0].status, 'unavailable');
assert.equal(reconcileLines(state.lines, [{ ...product, priceMinor: 210000 }]).lines[0].status, 'price_or_unit_changed');
assert.equal(reconcileLines(state.lines, [{ ...product, saleUnit: 'шт.' }]).totalMinor, null);
assert.equal(reconcileLines([{ ...state.lines[0], quantity: 0 }], [product]).lines[0].status, 'invalid_quantity');
assert.equal(removeLine(state, product.id).state.lines.length, 0);
assert.equal(removeLine(EMPTY_CART, product.id).changed, false);
const checkout = fs.readFileSync('src/app/(public)/checkout/CheckoutForm.tsx', 'utf8');
assert.match(checkout, /type="submit"[^>]*disabled/);
assert.match(checkout, /юридический текст согласия ещё не утверждён/);
assert.doesNotMatch(checkout, /серверная обработка не подключена/);
console.log('T069 synthetic cart persistence/reconciliation and Checkout legal-disabled copy PASS');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, globals = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const moduleObject = { exports: {} };
  vm.runInNewContext(js, { module: moduleObject, exports: moduleObject.exports,
    Set, Number, Date, Object, ...globals }, { filename: path });
  return moduleObject.exports;
}

const head = { nodes: [], appendChild(node) { this.nodes.push(node); } };
const doc = { head, getElementById(id) { return head.nodes.find(node => node.id === id); },
  createElement() { return {}; } };
const browser = {};
const metrika = load('src/lib/analytics/metrika.ts', { window: browser });
const adapter = metrika.createMetrikaAdapter(123456);
const calls = () => JSON.parse(JSON.stringify(browser.ym.a));
const goals = () => calls().filter(call => call[1] === 'reachGoal').map(call => call[2]);
const navigate = (path, goal) => {
  adapter.pageview(path, browser);
  if (goal) adapter.routeGoal(goal, path, browser);
};

adapter.routeGoal('catalog_view', '/catalog', browser); // inactive
adapter.goal('add_to_cart', browser); // inactive
adapter.start(browser, doc);
navigate('/');
assert.deepEqual(goals(), []);
navigate('/catalog', 'catalog_view');
navigate('/catalog', 'catalog_view');
navigate('/catalog?category=travertin', 'catalog_view');
navigate('/product/azur', 'product_view');
navigate('/product/azur', 'product_view');
navigate('/catalog', 'catalog_view');
navigate('/catalog/travertin', 'catalog_view');
navigate('/product/other', 'product_view');
navigate('/product/azur', 'product_view');
adapter.routeGoal('catalog_view', '/admin/orders/private', browser);
adapter.routeGoal('product_view', '/product/email@example.com', browser);
adapter.goal('purchase', browser);
assert.deepEqual(goals(), ['catalog_view', 'product_view', 'catalog_view',
  'catalog_view', 'product_view', 'product_view']);
assert.equal(calls().filter(call => call[1] === 'init').length, 1);
assert.equal(calls().filter(call => call[1] === 'hit').length, 7);
assert.equal(calls().filter(call => call[1] === 'reachGoal' && call.length !== 3).length, 0);

// The shared production gate is the only activation path. Preview has no adapter.
assert.equal(metrika.productionCounterId('preview', '123456'), null);
const preview = load('src/lib/analytics/metrika.ts', { window: {} });
preview.trackMetrikaRouteGoal('catalog_view', '/catalog');
preview.trackMetrikaCartGoal('add_to_cart');
assert.equal(preview.productionCounterId('preview', '123456'), null);

const cart = load('src/lib/cart/model.ts', { require(id) {
  assert.equal(id, '@/lib/catalog/commerce');
  return { MAX_DISPLAY_QUANTITY: 100, validQuantity: (rule, quantity) =>
    Number.isSafeInteger(quantity) && quantity >= rule.min && quantity <= rule.max &&
    (quantity - rule.min) % rule.step === 0 };
} });
const rule = { min: 1, step: 1, max: 100 };
let state = cart.EMPTY_CART;
const cartGoals = [];
function upsert(id, quantity) {
  const absent = !state.lines.some(line => line.productId === id);
  const result = cart.upsertLine(state, { productId: id, quantity }, rule);
  if (!result.ok || !result.changed) return;
  state = result.state;
  if (absent) cartGoals.push('add_to_cart');
}
function remove(id) {
  const result = cart.removeLine(state, id);
  if (!result.ok || !result.changed) return;
  state = result.state;
  cartGoals.push('remove_from_cart');
}
upsert('synthetic-id', 1);
upsert('synthetic-id', 1); // rapid double click
upsert('synthetic-id', 2); // quantity update
state = cart.updateQuantity(state, 'synthetic-id', 3, rule).state;
remove('synthetic-id');
remove('synthetic-id');
upsert('synthetic-id', 1);
assert.deepEqual(cartGoals, ['add_to_cart', 'remove_from_cart', 'add_to_cart']);

const provider = fs.readFileSync('src/lib/cart/CartProvider.tsx', 'utf8');
assert.match(provider, /stateRef\.current = loaded\.state/);
assert.match(provider, /if \(!result\.ok \|\| !result\.changed\) return/g);
assert.doesNotMatch(provider, /setState\(\(current\) =>[^\n]*trackMetrikaCartGoal/);
assert.doesNotMatch(provider, /trackMetrikaCartGoal\([^)]*,/);
console.log('Metrika route and cart goals harness PASS');

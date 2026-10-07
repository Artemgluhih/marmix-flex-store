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

const browser = {};
const document = { head: { appendChild() {} }, getElementById() { return null; }, createElement() { return {}; } };
const metrika = load('src/lib/analytics/metrika.ts', { window: browser });
const adapter = metrika.createMetrikaAdapter(456789);
const calls = () => JSON.parse(JSON.stringify(browser.ym.a));
const goals = () => calls().filter(call => call[1] === 'reachGoal');
assert.equal(adapter.goal('begin_checkout', browser), false); // before init
adapter.start(browser, document);

const eight = ['catalog_view', 'product_view', 'add_to_cart', 'remove_from_cart',
  'begin_checkout', 'order_submit', 'contact_click', 'phone_click'];
for (const name of eight) assert.equal(adapter.goal(name, browser), true);
for (const name of ['purchase', 'revenue', 'ecommerce', 'map_click', 'unknown'])
  assert.equal(adapter.goal(name, browser), false);
assert.deepEqual(goals().map(call => call[2]), eight);
assert.equal(goals().filter(call => call.length !== 3).length, 0);
browser.ym = () => { throw Error('analytics unavailable'); };
assert.equal(adapter.goal('contact_click', browser), false); // navigation must remain possible

const action = load('src/lib/analytics/actions.ts', { require(id) {
  assert.equal(id, './metrika'); return metrika;
} });
const observed = [];
const send = name => () => { observed.push(name); return true; };
const begin = action.createBeginCheckoutAction(send('begin_checkout'));
assert.equal(begin(), true);
assert.equal(begin(), false); // rapid double click and rerender of the same link instance
assert.deepEqual(observed, ['begin_checkout']);
assert.equal(action.createBeginCheckoutAction(send('begin_checkout'))(), true); // new cart visit

const keyA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const keyB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const keyLost = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const sent = [];
const submit = action.createOrderSubmitGoalTracker(() => { sent.push('order_submit'); return true; });
const privateBody = { submitted: true, request_id: 'private-request-id', phone: '+7 900 000-00-00' };
assert.equal(submit(keyA, 201, privateBody), true);
assert.equal(submit(keyA.toUpperCase(), 200, { ...privateBody, replayed: true }), false);
assert.equal(submit(keyLost, 0, null), false); // server may have committed, client lost response
assert.equal(submit(keyLost, 200, { submitted: true, replayed: true }), true);
assert.equal(submit(keyLost, 200, { submitted: true, replayed: true }), false);
assert.equal(submit(keyB, 201, { submitted: true }), true);
for (const [status, body] of [
  [400, { submitted: true }], [403, { submitted: true }],
  [409, { code: 'CART_CHANGED' }], [409, { code: 'IDEMPOTENCY_CONFLICT' }],
  [500, { submitted: true }], [503, { submitted: false }],
  [0, null], [201, { submitted: false }], [201, null],
]) assert.equal(submit('dddddddd-dddd-4ddd-8ddd-dddddddddddd', status, body), false);
assert.equal(submit('not-a-key', 201, { submitted: true }), false);
assert.deepEqual(sent, ['order_submit', 'order_submit', 'order_submit']);
assert.equal(JSON.stringify(observed.concat(sent)).includes('private-request-id'), false);
assert.equal(JSON.stringify(observed.concat(sent)).includes(keyA), false);

// Successful analytics dispatch alone consumes the key; Preview does not.
let enabled = false;
const delayed = action.createOrderSubmitGoalTracker(() => enabled);
assert.equal(delayed(keyA, 200, { submitted: true }), false);
enabled = true;
assert.equal(delayed(keyA, 200, { submitted: true }), true);
assert.equal(delayed(keyA, 200, { submitted: true }), false);
const preview = load('src/lib/analytics/metrika.ts', { window: {} });
assert.equal(preview.productionCounterId('preview', '456789'), null);
for (const name of ['begin_checkout', 'order_submit', 'contact_click', 'phone_click'])
  assert.equal(preview.trackMetrikaActionGoal(name), false);

const cart = fs.readFileSync('src/app/(public)/cart/CartContent.tsx', 'utf8');
const links = fs.readFileSync('src/lib/analytics/TrackedLinks.tsx', 'utf8');
const checkout = fs.readFileSync('src/app/(public)/checkout/CheckoutForm.tsx', 'utf8');
assert.match(cart, /if \(phase === "hydrating"\)/);
assert.match(cart, /if \(phase === "error"\)/);
assert.match(cart, /result\.totalMinor !== null && !technical && <TrackedCheckoutLink/);
assert.match(links, /href="\/checkout"/);
assert.match(links, /href="\/contacts"/);
assert.match(links, /trackMetrikaActionGoal\("contact_click"\)/);
assert.match(links, /trackMetrikaActionGoal\("phone_click"\)/);
assert.doesNotMatch(links, /request_id|idempotency|contactPhone|location\.href/);
assert.match(checkout, /type="submit"[^>]*disabled/);
assert.doesNotMatch(checkout, /trackSuccessfulOrderSubmission|fetch\(/);
for (const path of ['src/components/ui/Header.tsx', 'src/components/ui/Footer.tsx',
  'src/components/ui/Navigation.tsx']) {
  assert.match(fs.readFileSync(path, 'utf8'), /<TrackedContactLink/);
}
for (const path of ['src/app/(public)/EditorialContact.tsx', 'src/app/(public)/contacts/page.tsx']) {
  assert.match(fs.readFileSync(path, 'utf8'), /<TrackedPhoneLink/);
}
assert.match(fs.readFileSync('src/app/(public)/contacts/page.tsx', 'utf8'), /<a href=\{addressMapUrl\(address\)\}/);
assert.doesNotMatch(fs.readFileSync('src/app/(public)/contacts/page.tsx', 'utf8'), /contact_click|phone_click/);
console.log('Metrika checkout/contact and order success harness PASS');

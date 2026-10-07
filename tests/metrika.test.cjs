const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/lib/analytics/metrika.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(js, { module: moduleObject, exports: moduleObject.exports,
  Set, Number, Date, Object, Window: undefined }, { filename: 'metrika.ts' });
const { productionCounterId, publicPageviewPath, createMetrikaAdapter } = moduleObject.exports;

for (const [environment, id] of [
  ['preview', '123456'], ['development', '123456'], ['test', '123456'],
  [undefined, '123456'], ['production', undefined], ['production', ''],
  ['production', 'abc'], ['production', '123?x=1'], ['production', '0'],
  ['production', '9007199254740992'],
]) assert.equal(productionCounterId(environment, id), null);
assert.equal(productionCounterId('production', '123456'), 123456);

for (const path of ['/', '/catalog', '/catalog/travertin', '/product/azur', '/cart', '/checkout'])
  assert.equal(publicPageviewPath(path), path);
for (const path of [null, '/admin', '/admin/orders/uuid', '/catalog?q=phone',
  '/catalog#anchor', '/checkout/private-id', '/product/name@example.com', '//evil',
  '/product/%2Fsecret']) assert.equal(publicPageviewPath(path), null);

const head = { nodes: [], appendChild(node) { this.nodes.push(node); } };
const doc = { head, getElementById(id) { return head.nodes.find(node => node.id === id); },
  createElement(name) { assert.equal(name, 'script'); return {}; } };
const browser = {};
const adapter = createMetrikaAdapter(123456);
adapter.pageview('/', browser);
assert.equal(browser.ym, undefined);
adapter.start(browser, doc);
adapter.start(browser, doc);
assert.equal(head.nodes.length, 1);
assert.equal(head.nodes[0].src, 'https://mc.yandex.ru/metrika/tag.js');
assert.equal(head.nodes[0].async, true);
adapter.pageview('/', browser);
adapter.pageview('/', browser);
adapter.pageview('/catalog', browser);
adapter.pageview('/catalog', browser); // query-only navigation still supplies same pathname
adapter.pageview('/catalog?category=travertin', browser); // accidental raw URL is rejected
adapter.pageview('/catalog?q=private-search-text', browser);
adapter.pageview('/product/azur', browser);
adapter.pageview('/catalog', browser); // Back is a new pathname transition
adapter.pageview('/admin/orders/private-id', browser);
const calls = JSON.parse(JSON.stringify(browser.ym.a));
assert.equal(calls.length, 5);
assert.equal(calls.filter(call => call[1] === 'init').length, 1);
assert.deepEqual(calls.slice(1).map(call => call[2]), ['/', '/catalog', '/product/azur', '/catalog']);
assert.deepEqual(calls.slice(1).map(call => call[3]), [{}, { referer: '/' },
  { referer: '/catalog' }, { referer: '/product/azur' }]);
assert.equal(calls[0][2].defer, true);
assert.equal(calls[0][2].trackLinks, false);
assert.equal(calls[0][2].clickmap, false);
assert.equal(calls[0][2].webvisor, false);
assert.equal(calls[0][2].sendTitle, false);
assert.equal(calls.filter(call => call[1] === 'reachGoal').length, 0);
assert.equal(JSON.stringify(calls).includes('private-search-text'), false);

// Component has a server gate and is confined to the public layout.
const publicLayout = fs.readFileSync('src/app/(public)/layout.tsx', 'utf8');
const rootLayout = fs.readFileSync('src/app/layout.tsx', 'utf8');
assert.match(publicLayout, /productionCounterId\(process\.env\.VERCEL_ENV, process\.env\.YANDEX_METRIKA_ID\)/);
assert.match(publicLayout, /counterId !== null && <MetrikaPageviews/);
assert.doesNotMatch(rootLayout, /MetrikaPageviews|metrika/);
assert.doesNotMatch(source + publicLayout, /location\.href|searchParams|NEXT_PUBLIC_YANDEX/);
console.log('Metrika adapter and pageview harness PASS');

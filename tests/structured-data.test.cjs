const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, process: {
    env: { SITE_URL: 'https://marmixflex.ru', VERCEL_ENV: 'preview', VERCEL_URL: 'wrong.vercel.app' },
  }, require(name) {
    if (name === 'server-only') return {};
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '@/lib/catalog/commerce') return load('src/lib/catalog/commerce.ts');
    if (name === './metadata') return load('src/lib/seo/metadata.ts');
    if (name === './structured-data') return load('src/lib/seo/structured-data.ts');
    throw new Error('Unexpected module: ' + name);
  } }, { filename: file });
  cache.set(file, module.exports);
  return module.exports;
}
const seo = load('src/lib/seo/structured-data.ts');
const view = load('src/lib/seo/JsonLd.tsx');
const plain = data => JSON.parse(JSON.stringify(data));
const image = { url: 'https://example.supabase.co/storage/v1/object/public/product-media/x.png', alt: 'Азур' };
const panel = {
  catalogKind: 'REAL', isPublished: true, archivedAt: null,
  name: 'Азур', slug: 'azur', sku: 'MF-MAR-0086', description: null, seoDescription: null,
  priceMinor: 200000, currency: 'RUB', priceUnit: 'м²', saleUnit: 'sheet',
  minQuantity: 1, quantityStep: 1, areaPerSaleUnitM2: 4.0328, availabilityStatus: 'in_stock',
  primaryImage: image,
};
const catalog = plain(seo.catalogBreadcrumb());
const category = plain(seo.categoryBreadcrumb('Травертин', 'travertin'));
const productCrumb = plain(seo.productBreadcrumb(panel.name, panel.slug));
assert.deepEqual(catalog.itemListElement.map(x => x.position), [1, 2]);
assert.deepEqual(category.itemListElement.map(x => x.name), ['Главная', 'Каталог', 'Травертин']);
assert.deepEqual(productCrumb.itemListElement.map(x => x.name), ['Главная', 'Каталог', 'Азур']);
assert.equal(productCrumb.itemListElement[2].item, 'https://marmixflex.ru/product/azur');
for (const crumb of [catalog, category, productCrumb]) {
  assert.equal(crumb['@type'], 'BreadcrumbList');
  assert.equal(crumb['@context'], 'https://schema.org');
  for (const item of crumb.itemListElement) {
    assert.equal(item['@type'], 'ListItem');
    assert.ok(item.item.startsWith('https://marmixflex.ru/'));
    assert.ok(!item.item.includes('?'));
  }
}
const panelData = plain(seo.productStructuredData(panel));
assert.equal(panelData['@type'], 'Product');
assert.equal(panelData.name, 'Азур');
assert.equal(panelData.sku, 'MF-MAR-0086');
assert.equal(panelData.image, image.url);
assert.equal(panelData.description, undefined);
assert.equal(panelData.offers['@type'], 'Offer');
assert.equal(panelData.offers.availability, 'https://schema.org/InStock');
assert.equal(panelData.offers.priceCurrency, 'RUB');
assert.equal(panelData.offers.price, '8065.60'); // 2000 ₽/м² × 4.0328 m² per sheet.
assert.equal(panelData.offers.url, panelData.url);
assert.equal(panelData.brand, undefined);
assert.equal(panelData.category, undefined);
for (const key of ['seller', 'shippingDetails', 'hasMerchantReturnPolicy', 'aggregateRating', 'review', 'ratingValue', 'reviewCount']) assert.equal(panelData[key], undefined);
const accessory = { ...panel, name: 'Клей 3 кг', priceMinor: 160005,
  priceUnit: 'шт./упаковка', saleUnit: 'шт./упаковка', areaPerSaleUnitM2: null,
  minQuantity: 1, primaryImage: null, seoDescription: 'Подтверждённое описание' };
assert.equal(seo.productStructuredData(accessory).offers.price, '1600.05');
assert.equal(seo.productStructuredData(accessory).image, undefined);
assert.equal(seo.productStructuredData(accessory).description, 'Подтверждённое описание');
assert.equal(seo.productStructuredData({ ...accessory, minQuantity: 2 }).offers.price, '3200.10');
for (const change of [
  { availabilityStatus: null }, { availabilityStatus: 'on_order' }, { availabilityStatus: 'out_of_stock' },
  { currency: 'USD' }, { priceMinor: null }, { priceMinor: 1.5 },
  { areaPerSaleUnitM2: null }, { areaPerSaleUnitM2: 4.03280001 },
  { priceUnit: 'м²', saleUnit: 'шт./упаковка' },
  { catalogKind: 'TEST_ONLY' }, { isPublished: false }, { archivedAt: '2026-10-07' },
]) assert.equal(seo.productStructuredData({ ...panel, ...change }), null, JSON.stringify(change));
const injected = { ...accessory, name: '</script><script>alert(1)</script>', sku: '<svg>' };
const markup = renderToStaticMarkup(React.createElement(view.JsonLd, { data: seo.productStructuredData(injected) }));
assert.equal((markup.match(/<script/g) || []).length, 1);
assert.ok(markup.startsWith('<script type="application/ld+json">'));
assert.ok(markup.includes('\\u003c/script>'));
assert.ok(!markup.includes('</script><script>'));
assert.equal(JSON.parse(markup.slice(markup.indexOf('>') + 1, markup.lastIndexOf('</script>'))).name, injected.name);
assert.equal((fs.readFileSync('src/app/(public)/catalog/page.tsx', 'utf8').match(/productStructuredData/g) || []).length, 0);
console.log('PASS: 3 clean BreadcrumbList paths, exact min-purchase panel/accessory prices, eligibility/availability boundaries, safe rendered JSON-LD; no seller/shipping/ratings.');

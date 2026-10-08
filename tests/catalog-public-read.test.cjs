// Read-only integration harness; requires Preview publishable credentials, never a Secret key.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.error("UNVERIFIED: public catalog read needs Preview NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(2);
}

const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  cache.set(file, module.exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, process, console, URL, URLSearchParams, fetch,
    require(name) {
      if (name === "server-only") return {};
      if (name === "next/cache") return { unstable_cache: (fn) => fn };
      if (name.startsWith("@/")) return load(path.join("src", name.slice(2)) + ".ts");
      if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name) + ".ts");
      return require(name);
    },
  }, { filename: file });
  return module.exports;
}

const ordered = (rows) => rows.every((row, i) => i === 0 ||
  rows[i - 1].sortOrder < row.sortOrder ||
  rows[i - 1].sortOrder === row.sortOrder && rows[i - 1].id.localeCompare(row.id) < 0);
const byPrice = (rows, asc) => rows.every((row, i) => i === 0 ||
  row.priceMinor === null ||
  rows[i - 1].priceMinor !== null &&
    (asc ? rows[i - 1].priceMinor <= row.priceMinor : rows[i - 1].priceMinor >= row.priceMinor));

(async () => {
  const { listPublishedProducts, listPublishedCategories, listPublishedFeaturedProducts,
    getCatalogFacets, getPublishedProduct } = load("src/lib/catalog/queries.ts");
  const { evaluateCommerce } = load("src/lib/catalog/commerce.ts");
  const [cats, all, facets, featured] = await Promise.all([
    listPublishedCategories(), listPublishedProducts(), getCatalogFacets(), listPublishedFeaturedProducts(),
  ]);
  assert.ok(ordered(cats), "published category order follows sort_order + ID");
  assert.deepEqual(Array.from(facets.categories, (c) => c.id), Array.from(cats, (c) => c.id));
  assert.ok(all.total >= all.products.length);
  assert.ok(ordered(all.products), "default product order follows sort_order + ID");
  assert.ok(featured.length <= 6 && ordered(featured), "Featured is capped at 6 and ordered");
  assert.ok(featured.every((p) => p.isFeatured), "Featured items are marked featured");
  if (all.total === all.products.length) {
    assert.ok(featured.every((p) => all.products.some((a) => a.id === p.id)));
  }

  for (const cat of cats) {
    const [list, categoryFeatured] = await Promise.all([
      listPublishedProducts({ categorySlug: cat.slug }), listPublishedFeaturedProducts(cat.slug),
    ]);
    assert.equal(list.category.slug, cat.slug);
    assert.ok(ordered(list.products));
    assert.ok(list.products.every((p) => p.categories.some((c) => c.id === cat.id)));
    assert.ok(categoryFeatured.length <= 6 && ordered(categoryFeatured));
    assert.ok(categoryFeatured.every((p) => p.isFeatured && p.categories.some((c) => c.id === cat.id)));
    if (!list.products.length) continue;

    const product = list.products[0];
    if (product.availabilityStatus === null) {
      assert.notEqual(evaluateCommerce(product, true)?.commercialStatus, "ready");
    }
    const search = await listPublishedProducts({ categorySlug: cat.slug, q: product.sku });
    assert.ok(search.products.some((p) => p.id === product.id));
    const none = await listPublishedProducts({ categorySlug: cat.slug, q: "no-such-material-zzzz" });
    assert.equal(none.total, 0);
    assert.equal(none.category.slug, cat.slug);
    if (product.priceMinor !== null) {
      const exact = await listPublishedProducts({
        categorySlug: cat.slug,
        price_min: String(product.priceMinor / 100),
        price_max: String(product.priceMinor / 100),
      });
      assert.ok(exact.products.some((p) => p.id === product.id));
    }
    const out = await listPublishedProducts({ categorySlug: cat.slug, page: 10000 });
    assert.equal(out.products.length, 0);
    assert.equal(out.total, list.total);
    assert.equal(out.category.slug, cat.slug);
    const detail = await getPublishedProduct(product.slug);
    assert.equal(detail.id, product.id);
  }

  const [asc, desc] = await Promise.all([
    listPublishedProducts({ sort: "price_asc" }), listPublishedProducts({ sort: "price_desc" }),
  ]);
  assert.ok(byPrice(asc.products, true) && byPrice(desc.products, false));
  const [invalid, missing] = await Promise.all([
    listPublishedProducts({ categorySlug: "../bad" }),
    listPublishedProducts({ categorySlug: "nonexistent-public-category" }),
  ]);
  assert.equal(invalid.category, null);
  assert.equal(missing.category, null);
  assert.equal(missing.products.length, 0);
  assert.equal(new Set(all.products.map((p) => p.id)).size, all.products.length);
  console.log(`PASS: guest catalog contract; ${cats.length} published categories, ${all.total} REAL, ${featured.length} featured. No writes.`);
})().catch((error) => { console.error("FAIL: public catalog read/assertion", error); process.exit(1); });

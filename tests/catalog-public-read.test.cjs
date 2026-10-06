// Read-only integration harness; requires the existing Preview publishable env, never a Secret key.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);
const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{module,exports:module.exports,process,console,URL,URLSearchParams,fetch,require(name){
 if(name==='server-only')return {};
 if(name==='next/cache')return {unstable_cache:fn=>fn};
 if(name.startsWith('@/'))return load(path.join('src',name.slice(2))+'.ts');
 if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name)+'.ts');
 return require(name);
}}, {filename:file});return module.exports;}
(async()=>{
 const {listPublishedProducts,listPublishedCategories,listPublishedFeaturedProducts,getCatalogFacets,getPublishedProduct}=load('src/lib/catalog/queries.ts');
 const {evaluateCommerce}=load('src/lib/catalog/commerce.ts');
 const [cats,all,facets,featured]=await Promise.all([listPublishedCategories(),listPublishedProducts(),getCatalogFacets(),listPublishedFeaturedProducts()]);
 assert.ok(cats.length>0);assert.ok(all.total>=3);assert.equal(featured.length,0);
 for(let i=1;i<cats.length;i++)assert.ok(cats[i-1].sortOrder<cats[i].sortOrder||cats[i-1].sortOrder===cats[i].sortOrder&&cats[i-1].id.localeCompare(cats[i].id)<0);
 assert.equal(facets.availabilityStatuses.length,0);
 for(const cat of cats){assert.equal((await listPublishedFeaturedProducts(cat.slug)).length,0);const list=await listPublishedProducts({categorySlug:cat.slug});assert.equal(list.category.slug,cat.slug);assert.ok(list.total>=0);assert.ok(list.products.every(p=>p.categories.some(c=>c.id===cat.id)));
 if(list.total===0){assert.equal(list.products.length,0);continue;}
 const product=list.products[0];assert.equal(product.availabilityStatus,null);assert.notEqual(evaluateCommerce(product,true)?.commercialStatus,'ready');
 const search=await listPublishedProducts({categorySlug:cat.slug,q:product.sku});assert.equal(search.total,1);
 const none=await listPublishedProducts({categorySlug:cat.slug,q:'no-such-material-zzzz'});assert.equal(none.total,0);assert.equal(none.category.slug,cat.slug);
 const price=await listPublishedProducts({categorySlug:cat.slug,price_min:String(product.priceMinor/100),price_max:String(product.priceMinor/100)});assert.equal(price.total,1);
 const noPrice=await listPublishedProducts({categorySlug:cat.slug,price_min:'99999'});assert.equal(noPrice.total,0);
 const out=await listPublishedProducts({categorySlug:cat.slug,page:2});assert.equal(out.products.length,0);assert.equal(out.total,1);assert.equal(out.category.slug,cat.slug);
 const detail=await getPublishedProduct(product.slug);assert.equal(detail.id,product.id);
 }
 const asc=await listPublishedProducts({sort:'price_asc'}),desc=await listPublishedProducts({sort:'price_desc'});
 assert.deepEqual(Array.from(asc.products,p=>p.priceMinor),[160000,200000,210000]);assert.deepEqual(Array.from(desc.products,p=>p.priceMinor),[210000,200000,160000]);
 for(let i=1;i<all.products.length;i++){const a=all.products[i-1],b=all.products[i];assert.ok(a.sortOrder<b.sortOrder||a.sortOrder===b.sortOrder&&a.id.localeCompare(b.id)<0);}
 const invalid=await listPublishedProducts({categorySlug:'../bad'}),missing=await listPublishedProducts({categorySlug:'nonexistent-public-category'});assert.equal(invalid.category,null);assert.equal(missing.category,null);assert.equal(missing.products.length,0);
 assert.equal(new Set(all.products.map(p=>p.id)).size,all.products.length);
 console.log(`PASS: guest public layer, ${cats.length} published categories (including empty), ${all.total} REAL, ${featured.length} featured, ${all.products.filter(p=>p.availabilityStatus===null).length} NULL availability; category search/price/no-results/page/detail, default+price ordering, blocked commerce and missing/malformed category isolation. No writes.`);
})().catch(()=>{console.error('FAIL: public catalog read/assertion');process.exit(1)});

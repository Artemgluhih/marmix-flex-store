const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const modules = new Map();
let cart, calls = 0;
let homepageActive = null;
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const module = { exports: {} }; modules.set(file, module.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  vm.runInNewContext(code, {module,exports:module.exports,URLSearchParams,URL,console,require(name) {
    if (name === 'react' && file.endsWith('CatalogFragment.tsx')) return {...React,useState:()=>[homepageActive,(value)=>{homepageActive=value;}]};
    if (name.endsWith('.css')) return {__esModule:true,default:new Proxy({}, {get:(_,key)=>key})};
    if (name === 'next/link') return {__esModule:true,default:({children, scroll, ...props})=>React.createElement('a',props,children)};
    if (name === 'next/image') return {__esModule:true,default:({alt,src})=>React.createElement('img',{alt,src})};
    if (name === '@/lib/cart/CartProvider') return {useCart:()=>cart};
    if (name.startsWith('@/')) { const base=path.join('src',name.slice(2)); return load(fs.existsSync(base+'.tsx')?base+'.tsx':base+'.ts'); }
    if (name.startsWith('.')) {const base=path.resolve(path.dirname(file),name);return load(fs.existsSync(base+'.tsx')?base+'.tsx':base+'.ts');}
    return require(name);
  }}, {filename:file});
  return module.exports;
}
const { normalizeCatalogListParams } = load('src/lib/catalog/query-params.ts');
const { catalogHref } = load('src/lib/catalog/url-state.ts');
const { evaluateCommerce } = load('src/lib/catalog/commerce.ts');
const { upsertLine, EMPTY_CART } = load('src/lib/cart/model.ts');
const { CatalogControls } = load('src/components/catalog/CatalogControls.tsx');
const { CatalogSort } = load('src/components/catalog/CatalogSort.tsx');
const { CatalogPagination } = load('src/components/catalog/CatalogPagination.tsx');
const { CategoryCatalog } = load('src/components/catalog/CategoryCatalog.tsx');
const { ProductGrid } = load('src/components/catalog/ProductGrid.tsx');
const { CardCartAction } = load('src/components/catalog/CardCartAction.tsx');
const params = normalizeCatalogListParams({categorySlug:'travertin', q:' Травертин ',price_min:'1600',price_max:'2100.50',sort:'price_desc',page:'3',status:'in_stock'});
const url = new URL(catalogHref(params),'https://example.test');
assert.equal(url.pathname,'/catalog');
assert.equal(url.searchParams.get('page'),null);
assert.equal(url.searchParams.get('q'),'Травертин');
assert.equal(url.searchParams.get('price_max'),'2100.50');
assert.equal(url.searchParams.get('status'),'in_stock');
assert.equal(url.searchParams.get('category'),'travertin');
assert.equal(new URL(catalogHref(params,4),'https://example.test').searchParams.get('page'),'4');
assert.equal(new URL(catalogHref({...params,categorySlug:null}),'https://example.test').pathname,'/catalog');
assert.equal(new URL(catalogHref({...params,categorySlug:'gibkiy-mramor'}),'https://example.test').searchParams.get('category'),'gibkiy-mramor');
const category={id:'c',slug:'travertin',name:'Травертин',sortOrder:0};
const facets={categories:[category],availabilityStatuses:[],fixedPriceMinor:{min:160000,max:210000}};
const html = renderToStaticMarkup(React.createElement(CatalogControls,{params,facets,total:1}));
assert.match(html,/action="\/catalog"/);
assert.match(html,/href="\/catalog\?category=travertin">Сбросить/);
assert.match(html,/method="get"/);
assert.match(html,/name="category" value="travertin"/);
assert.doesNotMatch(html,/name="page"|name="status"/);
const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
assert.ok(links.every(link=>!link.includes('status=')),'absent availability facet is not preserved by category navigation');
let submitted=0;CatalogSort({value:'order'}).props.onChange({currentTarget:{form:{requestSubmit:()=>submitted++}}});
assert.equal(submitted,1);
const pagination=renderToStaticMarkup(React.createElement(CatalogPagination,{params,total:100,pageSize:24}));
assert.match(pagination,/\/catalog\?category=travertin/);
assert.doesNotMatch(pagination,/href="\/catalog\/travertin/);
const beyond=renderToStaticMarkup(React.createElement(CatalogPagination,{params:{...params,page:9},total:1,pageSize:24}));
assert.match(beyond,/К первой странице/);assert.doesNotMatch(beyond,/page=/);
const p={id:'test-component-only',slug:'technical-material',name:'Technical material',sku:'NOT-REAL',series:null,priceMinor:200000,currency:'RUB',priceUnit:'м²',saleUnit:'sheet',minQuantity:1,quantityStep:1,areaPerSaleUnitM2:4.0328,availabilityStatus:null,primaryImage:{url:'/technical-image',alt:'Preserved factual alt'},categories:[],isFeatured:false,sortOrder:0};
cart={state:EMPTY_CART,hydrationStatus:'ready',upsert:(id,quantity,rule,snapshot)=>{calls++;cart.state=upsertLine(cart.state,{productId:id,quantity,snapshot},rule).state;}};
const blocked=renderToStaticMarkup(React.createElement(ProductGrid,{products:[p],linkToDetail:true}));
assert.equal((blocked.match(/href="\/product\/technical-material"/g)||[]).length,3);
assert.match(blocked,/alt="Preserved factual alt"/);assert.match(blocked,/Подробнее/);
assert.doesNotMatch(blocked,/<button/);
const ready=evaluateCommerce({...p,availabilityStatus:'in_stock'},true);assert.equal(ready.commercialStatus,'ready');
const action=CardCartAction({productId:p.id,name:p.name,model:ready,snapshot:{name:p.name}});
action.props.onClick(); action.props.onClick();assert.equal(cart.state.lines.length,1);assert.equal(cart.state.lines[0].quantity,1);
const added=CardCartAction({productId:p.id,name:p.name,model:ready,snapshot:{name:p.name}});assert.equal(added.props.disabled,true);assert.match(added.props['aria-label'],/в корзине/);const before=calls;added.props.onClick();assert.equal(calls,before);
const hydration=CardCartAction({productId:p.id,name:p.name,model:ready,snapshot:{}});cart.hydrationStatus='hydrating';const hydrating=CardCartAction({productId:'other',name:'Other',model:ready,snapshot:{}});assert.equal(hydrating.props.disabled,true);cart.hydrationStatus='ready';
const full=renderToStaticMarkup(React.createElement(CategoryCatalog,{category,result:{products:[p],total:1,pageSize:24},facets,params,unfilteredTotal:1}));
assert.match(full,/role="search"/);assert.match(full,/name="price_min"/);assert.match(full,/name="sort"/);
const empty=renderToStaticMarkup(React.createElement(CategoryCatalog,{category,result:{products:[],total:0,pageSize:24},facets,params,unfilteredTotal:1}));assert.match(empty,/Материалы не найдены/);
console.log('PASS: category URL/query/page/reset/pagination, progressive GET/sort, scoped controls, factual facets, card detail/alt/commerce/hydration/idempotency and no-results component fixtures. No DB fixtures.');

const {CatalogFragment}=load('src/app/(public)/CatalogFragment.tsx');
const p2={...p,id:'second-component-only',name:'Second featured',slug:'second-featured',isFeatured:true};
const featured={...p,isFeatured:true};
const homeProps={products:[featured,p2],categories:[category,{...category,id:'empty-cat',slug:'empty-cat',name:'Empty category'}],categoryProducts:{travertin:[featured],'empty-cat':[]}};
function home(){return CatalogFragment(homeProps);}
function walk(node,result=[]){if(!node||typeof node!=='object')return result;result.push(node);React.Children.forEach(node.props?.children,child=>walk(child,result));return result;}
let tree=home();let nav=walk(tree).find(n=>n.type==='nav');assert.equal(nav.props['aria-label'],'Категории избранных материалов');assert.equal(walk(nav).filter(n=>n.type==='a').length,0);
let rendered=renderToStaticMarkup(tree);assert.match(rendered,/Second featured/);assert.match(rendered,/Technical material/);
walk(nav).find(n=>n.type==='button'&&n.props.children==='Травертин').props.onClick();tree=home();rendered=renderToStaticMarkup(tree);assert.match(rendered,/Technical material/);assert.doesNotMatch(rendered,/Second featured/);
nav=walk(tree).find(n=>n.type==='nav');assert.equal(walk(nav).find(n=>n.type==='button'&&n.props.children==='Травертин').props['aria-pressed'],true);
walk(nav).find(n=>n.type==='button'&&n.props.children==='Empty category').props.onClick();rendered=renderToStaticMarkup(home());assert.match(rendered,/В этой категории пока нет избранных материалов/);assert.doesNotMatch(rendered,/Second featured|Technical material/);
nav=walk(home()).find(n=>n.type==='nav');walk(nav).find(n=>n.type==='button'&&n.props.children==='Все материалы').props.onClick();assert.match(renderToStaticMarkup(home()),/Second featured/);
const homeSource=fs.readFileSync('src/app/(public)/CatalogFragment.tsx','utf8');assert.doesNotMatch(homeSource,/window\.location|router\.|fetch\(|scrollTo|href=\{.*category/);
assert.doesNotMatch(fs.readFileSync('src/app/(public)/page.tsx','utf8'),/categorySection|material-categories-title/);
console.log('PASS: compact homepage buttons, local active state, per-category preverified Featured sets, All restore and inline empty state; no navigation/reload/scroll calls. Component-only fixtures.');

for (const count of [1,2,3,4,5,6]) { homepageActive=null;const markup=renderToStaticMarkup(React.createElement(load('src/app/(public)/CatalogFragment.tsx').CatalogFragment,{...homeProps,products:Array.from({length:count},(_,i)=>({...featured,id:'fixture-'+i,name:'Featured '+i}))}));assert.equal((markup.match(/<article/g)||[]).length,count);assert.match(markup,/Смотреть весь каталог/);assert.match(markup,/Показаны избранные материалы/); }
const homeCss=fs.readFileSync('src/app/(public)/homeFragments.module.css','utf8');assert.match(homeCss,/repeat\(3, minmax\(0, 1fr\)\)/);assert.match(homeCss,/repeat\(2, minmax\(0, 1fr\)\)/);assert.match(homeCss,/grid-template-columns: 1fr/);
